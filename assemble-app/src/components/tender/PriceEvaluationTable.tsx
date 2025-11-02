'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import Handsontable from 'handsontable';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { EvaluationLineItem, useTenderEvaluationStore } from '@/stores/tenderEvaluationStore';

// Register all Handsontable modules
registerAllModules();

interface PriceEvaluationTableProps {
  tableId: string;
  tableNumber: number;
  tableName: string;
  firms: Array<{ id: string; name: string }>;
  items: EvaluationLineItem[];
  onDataChange?: (items: EvaluationLineItem[]) => void;
  readOnly?: boolean;
}

interface TableRowData {
  id: string;
  description: string;
  isCategory: boolean;
  level: number;
  parentId?: string;
  expanded?: boolean;
  [key: string]: any; // For dynamic firm columns
}

export function PriceEvaluationTable({
  tableId,
  tableNumber,
  tableName,
  firms,
  items,
  onDataChange,
  readOnly = false,
}: PriceEvaluationTableProps) {
  const hotTableRef = useRef<HotTable>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { updateFirmPrice, addLineItem, deleteLineItem, updateLineItem } = useTenderEvaluationStore();

  // Transform hierarchical items to flat structure for Handsontable
  const flattenItems = useCallback((
    items: EvaluationLineItem[],
    level: number = 0,
    parentId?: string
  ): TableRowData[] => {
    const result: TableRowData[] = [];

    items.forEach((item) => {
      const isExpanded = expandedCategories.has(item.id);
      const rowData: TableRowData = {
        id: item.id,
        description: item.description,
        isCategory: item.isCategory,
        level,
        parentId,
        expanded: isExpanded,
      };

      // Add firm price columns
      firms.forEach((firm) => {
        const price = item.firmPrices?.find((p) => p.firmId === firm.id);
        rowData[`firm_${firm.id}`] = price?.amount || 0;
      });

      // Add category subtotal column if it's a category
      if (item.isCategory && item.categorySubTotal) {
        rowData.subTotal = item.categorySubTotal;
      }

      result.push(rowData);

      // Add children if category is expanded
      if (item.children && item.children.length > 0 && isExpanded) {
        result.push(...flattenItems(item.children, level + 1, item.id));
      }
    });

    return result;
  }, [expandedCategories, firms]);

  // Generate table data
  const tableData = flattenItems(items);

  // Configure columns
  const columns = [
    {
      data: 'description',
      type: 'text',
      width: 350,
      renderer: function(
        instance: Handsontable,
        td: HTMLElement,
        row: number,
        col: number,
        prop: string | number,
        value: any,
        cellProperties: Handsontable.CellProperties
      ) {
        const rowData = instance.getSourceDataAtRow(row) as TableRowData;
        const indent = rowData.level * 20;
        const isCategory = rowData.isCategory;

        td.innerHTML = '';
        td.className = '';

        if (isCategory) {
          td.style.fontWeight = 'bold';
          td.style.backgroundColor = '#f5f5f5';
        }

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.paddingLeft = `${indent}px`;

        // Add expand/collapse icon for categories
        if (isCategory && rowData.id) {
          const icon = document.createElement('span');
          icon.style.cursor = 'pointer';
          icon.style.marginRight = '8px';
          icon.innerHTML = rowData.expanded ? '▼' : '▶';
          icon.onclick = (e) => {
            e.stopPropagation();
            toggleCategory(rowData.id);
          };
          wrapper.appendChild(icon);
        }

        const text = document.createElement('span');
        text.textContent = value;
        text.style.color = '#111827'; // text-gray-900
        wrapper.appendChild(text);

        td.appendChild(wrapper);
        return td;
      },
    },
    ...firms.map((firm) => ({
      data: `firm_${firm.id}`,
      type: 'numeric' as const,
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US',
      },
      width: 150,
      renderer: function(
        instance: Handsontable,
        td: HTMLElement,
        row: number,
        col: number,
        prop: string | number,
        value: any,
        cellProperties: Handsontable.CellProperties
      ) {
        const rowData = instance.getSourceDataAtRow(row) as TableRowData;

        if (rowData.isCategory) {
          // For categories, show the sum of children for this firm
          td.style.fontWeight = 'bold';
          td.style.backgroundColor = '#f5f5f5';
          td.style.textAlign = 'right';
          td.style.color = '#111827'; // text-gray-900

          // Calculate sum from children
          const firmId = firm.id;
          const categoryItem = items.find(i => i.id === rowData.id);
          if (categoryItem && categoryItem.children) {
            const sum = calculateCategorySum(categoryItem.children, firmId);
            td.textContent = `$${sum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
          } else {
            td.textContent = '$0.00';
          }
        } else {
          // Regular numeric renderer
          Handsontable.renderers.NumericRenderer(instance, td, row, col, prop, value, cellProperties);
          td.style.color = '#111827'; // text-gray-900
        }

        return td;
      },
    })),
  ];

  // Calculate sum for a category and specific firm
  const calculateCategorySum = (items: EvaluationLineItem[], firmId: string): number => {
    return items.reduce((sum, item) => {
      if (item.isCategory && item.children) {
        return sum + calculateCategorySum(item.children, firmId);
      } else {
        const price = item.firmPrices?.find(p => p.firmId === firmId);
        return sum + (price?.amount || 0);
      }
    }, 0);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Column headers
  const colHeaders = ['Item Description', ...firms.map((f) => f.name)];

  // Handle cell changes
  const handleAfterChange = (changes: Handsontable.CellChange[] | null, source: string) => {
    if (!changes || source === 'loadData') return;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      const rowData = hotTableRef.current?.hotInstance?.getSourceDataAtRow(row) as TableRowData;
      if (!rowData || rowData.isCategory) return;

      // Handle firm price updates
      if (typeof prop === 'string' && prop.startsWith('firm_')) {
        const firmId = prop.replace('firm_', '');
        const amount = parseFloat(newValue) || 0;
        updateFirmPrice(tableId, rowData.id, firmId, amount);
      }

      // Handle description updates
      if (prop === 'description') {
        updateLineItem(tableId, rowData.id, { description: newValue });
      }
    });
  };

  // Add new line item
  const handleAddItem = (isCategory: boolean = false) => {
    const newItem: EvaluationLineItem = {
      id: `new_${Date.now()}`,
      description: isCategory ? 'New Category' : 'New Item',
      isCategory,
      firmPrices: firms.map(f => ({ firmId: f.id, firmName: f.name, amount: 0 })),
      sortOrder: items.length,
      children: isCategory ? [] : undefined,
    };

    addLineItem(tableId, newItem);
  };

  // Delete selected rows
  const handleDeleteSelected = () => {
    const hot = hotTableRef.current?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return;

    const [startRow, , endRow] = selected[0];
    const rowsToDelete = [];

    for (let i = Math.min(startRow, endRow); i <= Math.max(startRow, endRow); i++) {
      const rowData = hot.getSourceDataAtRow(i) as TableRowData;
      if (rowData) {
        rowsToDelete.push(rowData.id);
      }
    }

    rowsToDelete.forEach(id => deleteLineItem(tableId, id));
  };

  // Context menu configuration
  const contextMenu = {
    items: {
      add_item: {
        name: 'Add Line Item',
        callback: () => handleAddItem(false),
      },
      add_category: {
        name: 'Add Category',
        callback: () => handleAddItem(true),
      },
      remove_row: {
        name: 'Delete Row(s)',
        callback: handleDeleteSelected,
      },
      sep1: '---------' as const,
      copy: {
        name: 'Copy',
      },
      paste: {
        name: 'Paste',
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Table {tableNumber}: {tableName}
        </h3>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddItem(false)}
              className="text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddItem(true)}
              className="text-gray-900 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <HotTable
          ref={hotTableRef}
          data={tableData}
          columns={columns}
          colHeaders={colHeaders}
          rowHeaders={true}
          width="100%"
          height="auto"
          stretchH="all"
          autoWrapRow={true}
          autoWrapCol={true}
          licenseKey="non-commercial-and-evaluation"
          contextMenu={!readOnly ? contextMenu : false}
          manualRowMove={!readOnly}
          afterChange={handleAfterChange}
          readOnly={readOnly}
          cells={(row, col) => {
            const rowData = hotTableRef.current?.hotInstance?.getSourceDataAtRow(row) as TableRowData;
            const cellMeta: Handsontable.CellMeta = {};

            // Make category cells read-only for firm columns
            if (rowData?.isCategory && col > 0) {
              cellMeta.readOnly = true;
            }

            return cellMeta;
          }}
          className="htCenter htMiddle"
        />
      </div>

      {/* Table Sub-total - Per Firm */}
      <div className="border-t pt-3">
        <div className="flex items-center" style={{ paddingLeft: '50px' }}>
          {/* Description column */}
          <div className="font-semibold text-gray-900" style={{ width: '350px' }}>
            Table Sub-total:
          </div>

          {/* Firm columns */}
          {firms.map((firm) => {
            const firmTotal = items.reduce((sum, item) => {
              if (item.isCategory && item.children) {
                return sum + calculateCategorySum(item.children, firm.id);
              } else if (!item.isCategory) {
                const price = item.firmPrices?.find(p => p.firmId === firm.id);
                return sum + (price?.amount || 0);
              }
              return sum;
            }, 0);

            return (
              <div
                key={firm.id}
                className="text-right font-bold text-gray-900"
                style={{ width: '150px', paddingRight: '12px' }}
              >
                ${firmTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}