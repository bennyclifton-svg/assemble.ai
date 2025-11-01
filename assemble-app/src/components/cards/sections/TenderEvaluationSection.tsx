'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, AlertCircle, Save, Plus } from 'lucide-react';
import { PriceEvaluationTable } from '@/components/tender/PriceEvaluationTable';
import {
  useTenderEvaluationStore,
  TenderEvaluationTable,
  EvaluationLineItem,
} from '@/stores/tenderEvaluationStore';
import { getFirmsAction as getFirms } from '@/app/actions/firm';
import { getFeeStructure } from '@/app/actions/feeStructure';
import {
  getTenderEvaluation,
  saveTenderEvaluation,
  retrieveFromTenderSchedules,
} from '@/app/actions/tenderEvaluation';

interface TenderEvaluationSectionProps {
  projectId: string;
  disciplineId: string;
  cardType?: 'consultant' | 'contractor';
}

export function TenderEvaluationSection({
  projectId,
  disciplineId,
  cardType = 'consultant',
}: TenderEvaluationSectionProps) {
  const {
    evaluation,
    shortListedFirms,
    isLoading,
    error,
    hasUnsavedChanges,
    setEvaluation,
    setShortListedFirms,
    setLoading,
    setError,
    recalculateAll,
    addTable,
  } = useTenderEvaluationStore();

  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load evaluation data and firms on mount
  useEffect(() => {
    loadData();
  }, [projectId, disciplineId, cardType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load short-listed firms
      // In the Firm model, disciplineId is used as consultantCardId/contractorCardId
      const firmsResult = await getFirms(projectId, disciplineId, cardType);

      if (!firmsResult.success) {
        throw new Error(firmsResult.error.message);
      }

      const shortListed = firmsResult.data.filter((f: any) => f.shortListed);
      setShortListedFirms(
        shortListed.map((f: any) => ({ id: f.id, name: f.entity }))
      );

      // Load or create tender evaluation
      // Using disciplineId as the card ID since that's how firms are stored
      let evaluationData = await getTenderEvaluation(
        projectId,
        disciplineId,
        cardType === 'consultant' ? disciplineId : undefined,
        cardType === 'contractor' ? disciplineId : undefined
      );

      if (!evaluationData) {
        // Create new evaluation with default tables
        evaluationData = {
          projectId,
          disciplineId,
          consultantCardId: cardType === 'consultant' ? disciplineId : undefined,
          contractorCardId: cardType === 'contractor' ? disciplineId : undefined,
          tables: [
            createDefaultTable(1, 'Original', shortListed),
            createDefaultTable(2, 'Adds and Subs', shortListed, true),
          ],
          grandTotal: 0,
        };
      }

      setEvaluation(evaluationData);

      // Load fee structure for Table 1 initialization
      if (!evaluationData.id) {
        await initializeTable1FromFeeStructure(shortListed);
      }
    } catch (err) {
      console.error('Error loading tender evaluation:', err);
      setError('Failed to load tender evaluation data');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTable = (
    tableNumber: number,
    tableName: string,
    firms: any[],
    withDefaults: boolean = false
  ): TenderEvaluationTable => {
    const items: EvaluationLineItem[] = [];

    if (withDefaults && tableNumber === 2) {
      // Add default items for Table 2 (Adds and Subs)
      for (let i = 1; i <= 3; i++) {
        items.push({
          id: `default_${tableNumber}_${i}`,
          description: `Additional Item ${i}`,
          isCategory: false,
          firmPrices: firms.map((f) => ({
            firmId: f.id,
            firmName: f.name || f.entity,
            amount: 0,
          })),
          sortOrder: i - 1,
        });
      }
    }

    return {
      id: `table_${tableNumber}`,
      tableNumber,
      tableName,
      items,
      subTotal: 0,
      sortOrder: tableNumber - 1,
    };
  };

  const initializeTable1FromFeeStructure = async (firms: any[]) => {
    try {
      const feeStructureData = await getFeeStructure(projectId, disciplineId);
      if (!feeStructureData || !feeStructureData.items) return;

      // Transform fee structure items to evaluation items (structure only, no prices)
      const evaluationItems = transformFeeStructureToEvaluationItems(
        feeStructureData.items,
        firms
      );

      // Update Table 1 with fee structure items
      if (evaluation && evaluation.tables.length > 0) {
        const updatedEvaluation = {
          ...evaluation,
          tables: evaluation.tables.map((table) =>
            table.tableNumber === 1
              ? { ...table, items: evaluationItems }
              : table
          ),
        };
        setEvaluation(updatedEvaluation);
      }
    } catch (err) {
      console.error('Error loading fee structure:', err);
    }
  };

  const transformFeeStructureToEvaluationItems = (
    feeItems: any[],
    firms: any[]
  ): EvaluationLineItem[] => {
    return feeItems.map((item, index) => {
      const evaluationItem: EvaluationLineItem = {
        id: `fee_${item.id || index}`,
        description: item.description || item.name || 'Item',
        isCategory: item.type === 'category' || item.isCategory || false,
        firmPrices: firms.map((f) => ({
          firmId: f.id,
          firmName: f.name || f.entity,
          amount: 0, // Prices start at 0, will be populated by retrieve action
        })),
        sortOrder: index,
      };

      // Handle hierarchical structure if present
      if (item.children && item.children.length > 0) {
        evaluationItem.children = transformFeeStructureToEvaluationItems(
          item.children,
          firms
        );
      }

      return evaluationItem;
    });
  };

  const handleRetrieveFromTenderSchedules = async () => {
    setIsRetrieving(true);
    setError(null);

    try {
      const result = await retrieveFromTenderSchedules(
        projectId,
        disciplineId,
        evaluation?.id
      );

      if (result.success && result.data) {
        // Update Table 1 with retrieved prices
        const updatedEvaluation = {
          ...evaluation!,
          tables: evaluation!.tables.map((table) =>
            table.tableNumber === 1
              ? { ...table, items: result.data.items }
              : table
          ),
        };
        setEvaluation(updatedEvaluation);
        recalculateAll();
      } else {
        setError(
          result.message ||
            'No tender submission data found. Please upload tender documents first.'
        );
      }
    } catch (err) {
      console.error('Error retrieving tender schedules:', err);
      setError('Failed to retrieve tender schedule prices');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleSave = async () => {
    if (!evaluation || !hasUnsavedChanges) return;

    setIsSaving(true);
    setError(null);

    try {
      await saveTenderEvaluation(evaluation);
      setError(null);
      // Reload to get the saved version with IDs
      await loadData();
    } catch (err) {
      console.error('Error saving tender evaluation:', err);
      setError('Failed to save tender evaluation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTable = () => {
    const newTableNumber = (evaluation?.tables.length || 0) + 1;
    const newTable: TenderEvaluationTable = {
      id: `table_${newTableNumber}_${Date.now()}`,
      tableNumber: newTableNumber,
      tableName: `Additional Table ${newTableNumber}`,
      items: [],
      subTotal: 0,
      sortOrder: newTableNumber - 1,
    };
    addTable(newTable);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading tender evaluation...</div>
        </CardContent>
      </Card>
    );
  }

  if (shortListedFirms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No short-listed firms found. Please mark firms as short-listed in the Firms section
              to enable price evaluation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tender Evaluation - Price</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetrieveFromTenderSchedules}
              disabled={isRetrieving}
            >
              <Download className="h-4 w-4 mr-1" />
              {isRetrieving ? 'Retrieving...' : 'Retrieve from Tender Schedules'}
            </Button>
            <Button
              variant={hasUnsavedChanges ? 'default' : 'outline'}
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Display short-listed firms */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Short-listed Firms:</h4>
          <div className="flex gap-2 flex-wrap">
            {shortListedFirms.map((firm) => (
              <span
                key={firm.id}
                className="px-3 py-1 bg-white border rounded-md text-sm"
              >
                {firm.name}
              </span>
            ))}
          </div>
        </div>

        {/* Price evaluation tables */}
        {evaluation && evaluation.tables.length > 0 && (
          <div className="space-y-6">
            {evaluation.tables.map((table) => (
              <PriceEvaluationTable
                key={table.id}
                tableId={table.id}
                tableNumber={table.tableNumber}
                tableName={table.tableName}
                firms={shortListedFirms}
                items={table.items}
              />
            ))}

            {/* Add new table button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleAddTable}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Table
              </Button>
            </div>

            {/* Grand Total */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Grand Total (All Tables):</span>
                <span className="text-2xl font-bold">
                  ${(evaluation.grandTotal || 0)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}