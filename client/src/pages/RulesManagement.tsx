import React, { useState, useEffect, useCallback } from 'react';
import Header from "../components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Plus, ToggleLeft, ToggleRight, Eye, Search, Filter } from 'lucide-react';
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

  const ruleTypes = ['discount', 'coverage', 'risk_assessment', 'escalation'];
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
      const response = await fetch(`/api/rules/${currentRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRule)
      });

      if (response.ok) {
        showAlert('success', 'Rule updated successfully');
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

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
      
      if (response.ok) {
        showAlert('success', 'Rule deleted successfully');
        fetchRules();
      } else {
        const error = await response.json();
        showAlert('error', error.error || 'Failed to delete rule');
      }
    } catch (error) {
      showAlert('error', 'Failed to delete rule');
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
          <h1 className="text-3xl font-bold">Business Rules</h1>
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
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>
              Modify the selected underwriting rule.
            </DialogDescription>
          </DialogHeader>
          {currentRule && (
            <div className="space-y-4">
              <div>
                <Label>Rule Type</Label>
                <Select
                  value={currentRule.ruleType}
                  onValueChange={(value) => setCurrentRule({ ...currentRule, ruleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confidence (0-1)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentRule.confidence}
                  onChange={(e) => setCurrentRule({ ...currentRule, confidence: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Conditions (JSON)</Label>
                <Textarea
                  value={formatJson(currentRule.conditions)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setCurrentRule({ ...currentRule, conditions: parsed });
                    } catch {
                      // Invalid JSON, keep the string for editing
                    }
                  }}
                  rows={4}
                />
              </div>
              <div>
                <Label>Action (JSON)</Label>
                <Textarea
                  value={formatJson(currentRule.action)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setCurrentRule({ ...currentRule, action: parsed });
                    } catch {
                      // Invalid JSON, keep the string for editing
                    }
                  }}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule}>
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rule Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rule Details</DialogTitle>
          </DialogHeader>
          {currentRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">{currentRule.id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">{currentRule.ruleType}</p>
                </div>
                <div>
                  <Label>Source</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">{currentRule.source}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {currentRule.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <Label>Confidence</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {(currentRule.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm bg-gray-100 p-2 rounded">
                    {new Date(currentRule.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <Label>Conditions</Label>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {formatJson(currentRule.conditions)}
                </pre>
              </div>
              <div>
                <Label>Action</Label>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {formatJson(currentRule.action)}
                </pre>
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
      </div>
    </div>
  );
};

export default RulesManagement;
