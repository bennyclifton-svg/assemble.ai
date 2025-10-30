'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, CellEditingStoppedEvent, CellKeyDownEvent, GridReadyEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Download, Plus, Loader2, Save } from 'lucide-react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  getFeeStructure,
  saveFeeStructure,
  retrieveFromCostPlanning,
  retrieveStages,
  getPlanCardId
} from '@/app/actions/feeStructure';
import type { FeeStructureItem } from '@/types/feeStructure';
import { transformStagesToCategories } from '@/lib/feeStructureUtils';
import { useFeeStructureStore } from '@/stores/feeStructureStore';

interface FeeStructureSectionProps {
  projectId: string;
  disciplineId: string;
  planCardId?: string; // Plan Card ID for retrieving stages
}

export function FeeStructureSection({ projectId, disciplineId, planCardId: planCardIdProp }: FeeStructureSectionProps) {
  const [rowData, setRowData] = useState<FeeStructureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isRetrievingStaging, setIsRetrievingStaging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [planCardId, setPlanCardId] = useState<string | undefined>(planCardIdProp);

  const gridRef = useRef<AgGridReact>(null);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Zustand store for fee structure state
  const { items: storeItems, setItems, appendCategories } = useFeeStructureStore();

  // Fetch Plan Card ID if not provided
  useEffect(() => {
    const fetchPlanCardId = async () => {
      if (!planCardIdProp) {
        const result = await getPlanCardId(projectId);
        if (result.success && result.data) {
          setPlanCardId(result.data);
        }
      }
    };
    fetchPlanCardId();
  }, [projectId, planCardIdProp]);

  // Load fee structure data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const result = await getFeeStructure(projectId, disciplineId);
      if (result.success && result.data) {
        const items = result.data.items || [];
        setRowData(items);
        setItems(items); // Sync with Zustand store
      }
      setIsLoading(false);
    };
    load();
  }, [projectId, disciplineId, setItems]);

  // Sync rowData with Zustand store
  useEffect(() => {
    setItems(rowData);
  }, [rowData, setItems]);


  // Auto-save with debounce
  const triggerAutoSave = useCallback((data: FeeStructureItem[]) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await saveFeeStructure(projectId, disciplineId, { items: data });
      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
        console.error('Failed to save fee structure:', result.error?.message);
      }
    }, 1000);
  }, [projectId, disciplineId]);

  // Retrieve from Cost Planning (AC 27)
  const handleRetrieveFromCostPlanning = async () => {
    setIsRetrieving(true);
    const result = await retrieveFromCostPlanning(projectId, disciplineId);

    if (result.success && result.data) {
      setRowData(result.data.items);
      triggerAutoSave(result.data.items);
    } else if (!result.success) {
      console.log('Cost Planning data not available:', result.error.message);
    }

    setIsRetrieving(false);
  };

  // Retrieve Staging from Plan Card
  const handleRetrieveStaging = async () => {
    // If no planCardId provided, try to fetch Plan Card for this project
    if (!planCardId) {
      console.info('Plan Card ID not provided. Feature requires Plan Card integration.');
      alert('Plan Card ID is required to retrieve staging. This feature will be available once the Plan Card is created for this project.');
      return;
    }

    setIsRetrievingStaging(true);

    try {
      // Call retrieveStages server action
      const result = await retrieveStages(planCardId);

      if (result.success && result.data) {
        // Transform stage names to category items
        const newCategories = transformStagesToCategories(result.data);

        // Append to Zustand store (which handles order management)
        appendCategories(newCategories);

        // Update local rowData state
        const updatedData = [...rowData, ...newCategories.map((cat, idx) => ({
          ...cat,
          order: rowData.length + idx,
        }))];
        setRowData(updatedData);
        triggerAutoSave(updatedData);
      } else if (!result.success) {
        console.log('Staging data not available:', result.error.message);
        alert(`Unable to retrieve staging: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Error retrieving staging:', error);
      alert('An error occurred while retrieving staging. Please try again.');
    } finally {
      setIsRetrievingStaging(false);
    }
  };

  // Add category
  const addCategory = useCallback(() => {
    const newCategory: FeeStructureItem = {
      id: `cat-${Date.now()}`,
      type: 'category',
      description: '',
      order: rowData.length,
    };
    const newData = [...rowData, newCategory];
    setRowData(newData);

    // Focus the new row after a short delay
    setTimeout(() => {
      const api = gridRef.current?.api;
      if (api) {
        const rowIndex = newData.length - 1;
        api.setFocusedCell(rowIndex, 'description');
        api.startEditingCell({ rowIndex, colKey: 'description' });
      }
    }, 100);
  }, [rowData]);

  // Add line item (quantity/unit will come from Plan Card staging)
  const addLineItem = useCallback(() => {
    const newItem: FeeStructureItem = {
      id: `item-${Date.now()}`,
      type: 'item',
      description: '',
      order: rowData.length,
    };
    const newData = [...rowData, newItem];
    setRowData(newData);

    // Focus the new row after a short delay
    setTimeout(() => {
      const api = gridRef.current?.api;
      if (api) {
        const rowIndex = newData.length - 1;
        api.setFocusedCell(rowIndex, 'description');
        api.startEditingCell({ rowIndex, colKey: 'description' });
      }
    }, 100);
  }, [rowData]);

  // Handle cell editing stopped
  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const updatedData = [...rowData];
    const rowIndex = event.rowIndex!;
    updatedData[rowIndex] = event.data;
    setRowData(updatedData);
    triggerAutoSave(updatedData);
  }, [rowData, triggerAutoSave]);

  // Handle keyboard events for auto-add row on Tab/Enter from description cell (last editable column)
  const onCellKeyDown = useCallback((event: CellKeyDownEvent) => {
    const { event: keyEvent, column, rowIndex, api } = event;
    if (!keyEvent || !(keyEvent instanceof KeyboardEvent)) return;
    const key = keyEvent.key;

    // Check if we're in the description cell of the last row
    const isLastRow = rowIndex === rowData.length - 1;
    const isDescriptionColumn = column.getColId() === 'description';

    if ((key === 'Tab' || key === 'Enter') && isLastRow && isDescriptionColumn) {
      keyEvent.preventDefault();

      // Add new row based on current row type (quantity/unit come from Plan Card staging)
      const currentRow = event.data as FeeStructureItem;
      const newRow: FeeStructureItem = currentRow.type === 'category' ? {
        id: `cat-${Date.now()}`,
        type: 'category',
        description: '',
        order: rowData.length,
      } : {
        id: `item-${Date.now()}`,
        type: 'item',
        description: '',
        order: rowData.length,
      };

      const newData = [...rowData, newRow];
      setRowData(newData);

      // Focus the new row's description cell
      setTimeout(() => {
        const newRowIndex = newData.length - 1;
        api.setFocusedCell(newRowIndex, 'description');
        api.startEditingCell({ rowIndex: newRowIndex, colKey: 'description' });
      }, 100);
    }
  }, [rowData]);

  // Delete row action
  const deleteRow = (rowId: string) => {
    setRowData((currentData) => {
      const newData = currentData.filter(item => item.id !== rowId && item.parentId !== rowId);
      triggerAutoSave(newData);
      return newData;
    });
  };

  // Custom cell renderer for type indicator
  const TypeIndicatorCellRenderer = useCallback((params: any) => {
    const isCategory = params.data?.type === 'category';
    return (
      <span className="text-gray-400">
        {isCategory ? '▶' : '•'}
      </span>
    );
  }, []);

  // Custom cell renderer for delete action
  const DeleteCellRenderer = useCallback((params: any) => {
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (params.data?.id) {
        deleteRow(params.data.id);
      }
    };

    return (
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800 transition-colors p-1"
        title="Delete row"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    );
  }, []);

  // Column definitions with Excel-like editing (Description only, quantity/unit come from Plan Card)
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'type',
      headerName: '',
      width: 50,
      cellRenderer: TypeIndicatorCellRenderer,
      editable: false,
      suppressMovable: true,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      editable: true,
      cellClass: (params: any) => params.data?.type === 'category' ? 'font-semibold' : 'pl-4',
      cellStyle: (params: any) => params.data?.type === 'category' ? { backgroundColor: '#f9fafb' } : undefined,
    },
    {
      headerName: 'Actions',
      width: 80,
      cellRenderer: DeleteCellRenderer,
      editable: false,
      suppressMovable: true,
      cellClass: 'flex items-center justify-center',
    },
  ], []);

  // Grid options
  const defaultColDef: ColDef = useMemo(() => ({
    resizable: true,
    sortable: false,
    filter: false,
    suppressMovable: true,
  }), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading fee structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRetrieveFromCostPlanning}
          disabled={isRetrieving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Retrieve fee structure from Cost Planning Card"
        >
          {isRetrieving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Retrieving...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Retrieve from Cost Planning
            </>
          )}
        </button>

        <button
          onClick={handleRetrieveStaging}
          disabled={isRetrievingStaging}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Retrieve stages from Plan Card and add as categories"
        >
          {isRetrievingStaging ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Retrieving...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Retrieve Staging
            </>
          )}
        </button>

        <button
          onClick={addCategory}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>

        <button
          onClick={addLineItem}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Line Item
        </button>

        {saveStatus !== 'idle' && (
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-600">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Save className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* AG Grid Table */}
      <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellEditingStopped={onCellEditingStopped}
          onCellKeyDown={onCellKeyDown}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          suppressCellFocus={false}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          animateRows={true}
          rowSelection="single"
        />
      </div>

      <p className="text-xs text-gray-500">
        💡 Click any cell to edit • Press Tab/Enter to add a new row • Quantity and unit values come from Plan Card staging • Auto-saves as you type
      </p>
    </div>
  );
}
