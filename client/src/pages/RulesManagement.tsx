import React, { useState, useEffect, useCallback } from 'react';
import Header from "../components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Plus, ToggleLeft, ToggleRight, Eye, Search, Filter, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface Rule {
  id: number;
  ruleType: string;
  conditions: any;
  action: any;
  confidence: number;
  source: string;
  isActive: boolean;
  createdAt: number;
  sourceDocumentId: number | null;
}

interface RulesResponse {
  rules: Rule[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRules: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const RulesManagement: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRules: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [filters, setFilters] = useState({
    ruleType: '',
    isActive: '',
    search: ''
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteRequestDialog, setShowDeleteRequestDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [newRule, setNewRule] = useState({
    ruleType: '',
    conditionField: '',
    conditionOperator: 'equals',
    conditionValue: '',
    actionType: 'discount',
    actionValue: '',
    confidence: 0.5,
    source: 'manual'
  });

  const [editableRule, setEditableRule] = useState({
    ruleType: '',
    conditionField: '',
    conditionOperator: 'equals',
    conditionValue: '',
    actionType: 'discount',
    actionValue: '',
    confidence: 0.5
  });

  const ruleTypes = ['discount', 'coverage', 'risk_assessment', 'escalation', 'compliance', 'pricing', 'underwriting'];
  const sources = ['manual', 'extracted_from_chat', 'guideline_document'];

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '20'
      });
      
      if (filters.ruleType && filters.ruleType !== 'all') params.append('ruleType', filters.ruleType);
      if (filters.isActive && filters.isActive !== 'all') params.append('isActive', filters.isActive);

      const response = await fetch(`/api/rules/all?${params}`);
      const data: RulesResponse = await response.json();
      
      let filteredRules = data.rules;
      if (filters.search) {
        filteredRules = data.rules.filter(rule => 
          JSON.stringify(rule).toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setRules(filteredRules);
      setPagination(data.pagination);
    } catch (error) {
      showAlert('error', 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters.ruleType, filters.isActive, filters.search]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async () => {
    try {
      const conditions = { [newRule.conditionField]: { [newRule.conditionOperator]: newRule.conditionValue } };
      const action = { [newRule.actionType]: newRule.actionValue };
      
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: newRule.ruleType,
          conditions,
          action,
          confidence: newRule.confidence,
          source: newRule.source
        })
      });

      if (response.ok) {
        showAlert('success', 'Rule created successfully');
        setShowCreateDialog(false);
        setNewRule({ 
          ruleType: '', 
          conditionField: '',
          conditionOperator: 'equals',
          conditionValue: '',
          actionType: 'discount',
          actionValue: '',
          confidence: 0.5, 
          source: 'manual' 
        });
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to create rule');
      }
    } catch (error) {
      showAlert('error', 'Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!currentRule) return;

    try {
      // Convert plain English back to JSON
      const conditions = { [editableRule.conditionField]: { [editableRule.conditionOperator]: editableRule.conditionValue } };
      const action = { [editableRule.actionType]: editableRule.actionValue };
      
      const updatedRule = {
        ...currentRule,
        ruleType: editableRule.ruleType,
        conditions,
        action,
        confidence: editableRule.confidence
      };

      const response = await fetch(`/api/rules/${currentRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRule)
      });

      if (response.ok) {
        // Trigger LLM fine-tuning after successful rule update
        try {
          await fetch('/api/fine-tuning/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trigger: 'rule_update',
              ruleId: currentRule.id,
              changes: { conditions, action }
            })
          });
        } catch (fineTuningError) {
          console.log('Fine-tuning trigger failed:', fineTuningError);
          // Don't fail the rule update if fine-tuning fails
        }

        showAlert('success', 'Rule updated successfully and LLM training initiated');
        setShowEditDialog(false);
        setCurrentRule(null);
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to update rule');
      }
    } catch (error) {
      showAlert('error', 'Failed to update rule');
    }
  };

  // Helper function to convert JSON to plain English for editing
  const convertRuleToPlainEnglish = (rule: Rule) => {
    const conditionField = Object.keys(rule.conditions)[0] || '';
    const conditionObj = rule.conditions[conditionField] || {};
    const conditionOperator = Object.keys(conditionObj)[0] || 'equals';
    const conditionValue = conditionObj[conditionOperator] || '';
    
    const actionType = Object.keys(rule.action)[0] || 'discount';
    const actionValue = rule.action[actionType] || '';
    
    return {
      conditionField,
      conditionOperator,
      conditionValue: String(conditionValue),
      actionType,
      actionValue: String(actionValue)
    };
  };

  const handleDeleteRequest = (rule: Rule) => {
    setRuleToDelete(rule);
    setShowDeleteRequestDialog(true);
  };

  const submitDeleteRequest = async () => {
    if (!ruleToDelete || !deleteReason.trim()) {
      showAlert('error', 'Please provide a reason for deletion');
      return;
    }

    try {
      // Create a deletion request instead of actually deleting
      const response = await fetch('/api/rules/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: ruleToDelete.id,
          reason: deleteReason,
          requestedBy: 'current_user', // This would come from auth context
          requestedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        showAlert('success', 'Delete request submitted to administrators');
        setShowDeleteRequestDialog(false);
        setRuleToDelete(null);
        setDeleteReason('');
      } else {
        showAlert('error', 'Failed to submit delete request');
      }
    } catch (error) {
      showAlert('error', 'Failed to submit delete request');
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/rules/${ruleId}/toggle`, { method: 'PATCH' });
      
      if (response.ok) {
        showAlert('success', 'Rule status updated');
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to toggle rule');
      }
    } catch (error) {
      showAlert('error', 'Failed to toggle rule');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRules.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRules.size} rules?`)) return;

    try {
      const response = await fetch('/api/rules/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIds: Array.from(selectedRules) })
      });

      if (response.ok) {
        const result = await response.json();
        showAlert('success', `${result.deletedCount} rules deleted successfully`);
        setSelectedRules(new Set());
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to delete rules');
      }
    } catch (error) {
      showAlert('error', 'Failed to delete rules');
    }
  };

  const handleBulkToggle = async (isActive: boolean) => {
    if (selectedRules.size === 0) return;

    try {
      const response = await fetch('/api/rules/bulk/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIds: Array.from(selectedRules), isActive })
      });

      if (response.ok) {
        const result = await response.json();
        showAlert('success', `${result.updatedCount} rules updated successfully`);
        setSelectedRules(new Set());
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to update rules');
      }
    } catch (error) {
      showAlert('error', 'Failed to update rules');
    }
  };

  const selectAllRules = () => {
    if (selectedRules.size === rules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(rules.map(rule => rule.id)));
    }
  };

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-6">
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Underwriting Rules</h1>
          <p className="text-gray-600">Create and manage your underwriting rules in simple terms</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Rule
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Find Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search rules..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Rule Category</Label>
              <Select value={filters.ruleType} onValueChange={(value) => setFilters({ ...filters, ruleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="discount">Discounts</SelectItem>
                  <SelectItem value="coverage">Coverage Rules</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                  <SelectItem value="escalation">Escalation Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filters.isActive} onValueChange={(value) => setFilters({ ...filters, isActive: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchRules}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRules.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedRules.size} rules selected
              </span>
              <Button variant="outline" size="sm" onClick={() => handleBulkToggle(true)}>
                Turn On Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkToggle(false)}>
                Turn Off Selected
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rules ({pagination.totalRules})</CardTitle>
              <CardDescription>
                Page {pagination.currentPage} of {pagination.totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRules.size === rules.length && rules.length > 0}
                onCheckedChange={selectAllRules}
              />
              <Label>Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedRules.has(rule.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedRules);
                          if (checked) {
                            newSelected.add(rule.id);
                          } else {
                            newSelected.delete(rule.id);
                          }
                          setSelectedRules(newSelected);
                        }}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.ruleType}
                          </Badge>
                          <Badge variant="outline">
                            {rule.source}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Confidence: {(rule.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-sm">
                          <strong>When:</strong> {JSON.stringify(rule.conditions)}
                        </div>
                        <div className="text-sm">
                          <strong>Then:</strong> {JSON.stringify(rule.action)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(rule.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentRule(rule);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentRule(rule);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(rule)}
                        title="Request deletion"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
            <DialogDescription>
              Set up a new business rule to help make decisions automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>What kind of rule is this?</Label>
              <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discounts</SelectItem>
                  <SelectItem value="coverage">Coverage Rules</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                  <SelectItem value="escalation">Escalation Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={newRule.source} onValueChange={(value) => setNewRule({ ...newRule, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>How sure are we? (0 = not sure, 1 = very sure)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={newRule.confidence}
                onChange={(e) => setNewRule({ ...newRule, confidence: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Check this field</Label>
                <Input
                  placeholder="e.g., revenue, customer_type"
                  value={newRule.conditionField}
                  onChange={(e) => setNewRule({ ...newRule, conditionField: e.target.value })}
                />
              </div>
              <div>
                <Label>Comparison</Label>
                <Select value={newRule.conditionOperator} onValueChange={(value) => setNewRule({ ...newRule, conditionOperator: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="greater_than">greater than</SelectItem>
                    <SelectItem value="less_than">less than</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>This value</Label>
                <Input
                  placeholder="e.g., 100000, small_business"
                  value={newRule.conditionValue}
                  onChange={(e) => setNewRule({ ...newRule, conditionValue: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action type</Label>
                <Select value={newRule.actionType} onValueChange={(value) => setNewRule({ ...newRule, actionType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Apply discount</SelectItem>
                    <SelectItem value="message">Show message</SelectItem>
                    <SelectItem value="escalate">Escalate to human</SelectItem>
                    <SelectItem value="approve">Auto approve</SelectItem>
                    <SelectItem value="reject">Auto reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action value</Label>
                <Input
                  placeholder="e.g., 10%, Contact manager"
                  value={newRule.actionValue}
                  onChange={(e) => setNewRule({ ...newRule, actionValue: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={g </escr  Descr    / {currHu dr
          {currentRuil && (me="space-y-4">
             vcassNam="spc-y-4"
               d vpe</Label>
              e<Label>RTy</Lbl>
              Se u=rRule.ruleType}
                  value=      >.ruleType}
              onValue ha ge={(<alue) => sStCureenlRule({e...ctTriggRule,er>leType: vau })}
          >
                u <Sctrger>
                    <SeeVal />
                  </S lTTyp
               <Sel c Conetnt>t>
                    {    {ruyspmap(t( => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Lab{ruCoTypes.n p(>yp (
                  ty k"y{yp} {ty}{y}
                  va))}
                  onChange={(e) => setCurrentRule({ ...currentRule, confidence: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Confidonc(J</-
                <Textarea
                  value={formatJson(currentRule.conditions)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setCurrentRule({ ...currentRule, conditions: parsed });
                    } catch {
                      // Invalid JSON, keep the string for editing
                    }
              <div>    }}
              r <Lsl>Citions(JSON)</Lal
                /Txa
                </>aue={formtJon(currentRul.condtn)}
              <dionChange={(e)v= {
               <LabSOry/{
                  <Texcorst parsed = JSON.earse(e.target.valae);
                  valusetCurrontRua(({ .crcurnultRel.actondini)ns: pasd });
                 onC}hcn=h {
                     t//rI vlid JSON, kphstrngfr eg
                    }
                
                  rows={4}
                />
                  setCurrentRule({ ...currentRule, action: parsed });
                } catch {
                  // InActJON (JSON), keep the string for editing
                }Txarea
              }}formatJson(currna)
              rows={
                try/{
>              </divconst>parsed=JON.pars(.aet.valu);
           </div>setCurrentRule({...currntRu, aion: prsd});
         )}}ach {
            <DialogFoo//tInvalideJ>ON, kep th sring fr ediig
       <Button varie}(false)}>
              Canc}}
el          rows={4}
  </Button>
             <</div>
Button onClUdiv
          )}
    UpdateuDiagFoor
            <Button<variant="outline"/onClick={()B=>ustShowEditDiaog(fals)}
          </DiCancel>
        </Din/Buttont>
      </DialButton onCck={hndUpdtRue}
Udae Rule
      {/* Vi</Button>
ew Rule Di</Dio}oFootr>
      <D</DialogContent>
ialog </Dialog>

open={D/* Vlow nOpe DgtSog */wViewDialog}>
      <DisloN opanme-howVm-wDlwyog}>OpeChng={sShowViwDiog>
        <DialogContent className="max-w-4xl max-h-[90vh]<overflow-y-auto"er>
          gDtalogHeadere>Rule Details</DialogTitle>
          </<DialogTitle>RuleDDetailsogDealogTitleder>
          reDtalogHeaderule && (
          {cuiglntRu2eg&&4(
            <divv>ac-y-"
                <Label>ID</Label>
                <p className="text-sm bg-gray-100 p-2 rounded">{currentRule.id}</p>
                </v>ID
                <d>p cassNam="ext-smbg-gray-100 p-2 rounded">{currentRule.id}</p>
                </div>
  <Lab          </Lv>
                  <Lbe>></Label>
                  <p<className="text-smpbg-gray-100 p-2crlatdxd">-cgrr-n2ndedrrrulp></p>
                </div>
        </di    <div>
            <div>Lab>Sourc</Labl
                <L<paclassName="text-smbbg-gray-100ep-2lroundrd">{curreneRuLe.soarcb}<lp>
                </div>
            <p cldtvsm bg-gray-100 p-2 rounded">{currentRule.source}</p>
            </div>Lab>Saus</Labl
          <div>p cassNam="xt-sbg-gry-100 -2rdd"
              <Label{currtntRuat.isAu/ivL ?b'Actie' :'Iniv'}
                  </p>
       <p clate>div
                <div>
              {currLabii>Ctnfidvnce'}Lab
            </p>p cassNam="xt-sbg-gry-100 p-2 rondd
              </div>{(currntRu.fidce * 100).oFixed(1)}%
              <div>p
                <Label>Confidence</Label>
                <p className="text-sm bg-gray-100 p-2 rounded">
                  {(curreCreaRiddence * 100).toFixed(1)}%
                </p>cassNmtxt-sm bg-ray-0 p-2rudd>
              <div>nw Da(rrecreatA).oLcSin(lassName="text-sm bg-gray-100 p-2 rounded">
                    pw Date(currentRule.createdAt).toLocaleString()}
                  </p>
                </di              </div>
              <div
                <Label>Conditions (Plain English)</Label>
                <div className="text-sm bg-blue-50 p-3 rounded border">
                  {/* Convert JSON to plain English */}
                  {Object.entries(currentRule.conditions).map(([field, condition]: [string, any]) => (
                    <div key={field} className="mb-2">
                      <strong>When {field}</strong>{' '}
                      {Object.entries(condition).map(([operator, value]: [string, any]) => (
                        <span key={operator}>
                          {operator === 'equals' && `equals "${value}"`}
                          {operator === 'greater_than' && `is greater than ${value}`}
                          {operator === 'less_than' && `is less than ${value}`}
                          {operator === 'contains' && `contains "${value}"`}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Action (Plain English)</Label>
                <div className="text-sm bg-green-50 p-3 rounded border">
                  {/* Convert JSON to plain English */}
                  {Object.entries(currentRule.action).map(([actionType, value]: [string, any]) => (
                    <div key={actionType} className="mb-2">
                      <strong>Then</strong>{' '}
                      {actionType === 'discount' && `apply ${value} discount`}
                      {actionType === 'message' && `show message: "${value}"`}
                      {actionType === 'escalate' && `escalate to ${value}`}
                      {actionType === 'approve' && `automatically approve`}
                      {actionType === 'reject' && `automatically reject`}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Technical Details (JSON)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Conditions</Label>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                      {formatJson(currentRule.conditions)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-xs">Action</Label>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                      {formatJson(currentRule.action)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Request Dialog */}
      <Dialog open={showDeleteRequestDialog} onOpenChange={setShowDeleteRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Request Rule Deletion
            </DialogTitle>
            <DialogDescription>
              Submit a request to administrators to delete this rule. Provide a reason for the deletion request.
            </DialogDescription>
          </DialogHeader>
          {ruleToDelete && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium">Rule to Delete:</div>
                <div className="text-sm text-gray-600">
                  ID: {ruleToDelete.id} - {ruleToDelete.ruleType}
                </div>
              </div>
              <div>
                <Label htmlFor="deleteReason">Reason for Deletion *</Label>
                <Textarea
                  id="deleteReason"
                  placeholder="Please explain why this rule should be deleted..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will create a deletion request for administrators to review. The rule will remain active until approved.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteRequestDialog(false);
                setRuleToDelete(null);
                setDeleteReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitDeleteRequest}
              disabled={!deleteReason.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default RulesManagement;
