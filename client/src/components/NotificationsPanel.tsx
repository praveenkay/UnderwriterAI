import React, { useState } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Info, Clock, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  targetRoles: ('zurich_admin' | 'zurich_user' | 'external_broker')[];
  actionType?: 'delete_document' | 'delete_rule' | 'approve_request';
  actionData?: {
    itemId: number;
    itemType: 'document' | 'rule';
    itemName: string;
    requestedBy: string;
    reason: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'warning',
    title: 'Policy Review Required',
    message: 'Your policy application requires additional documentation',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    targetRoles: ['external_broker']
  },
  {
    id: 2,
    type: 'success',
    title: 'Quote Approved',
    message: 'Your quote for ABC Ltd has been approved and is ready for binding',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    targetRoles: ['external_broker']
  },
  {
    id: 3,
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM GMT',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    targetRoles: ['zurich_admin', 'zurich_user', 'external_broker']
  },
  {
    id: 4,
    type: 'warning',
    title: 'Escalation Alert',
    message: 'Policy amendment for XYZ Corp requires manual review',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    targetRoles: ['zurich_admin', 'zurich_user']
  },
  {
    id: 5,
    type: 'success',
    title: 'Document Processed',
    message: 'Underwriting guidelines document successfully ingested',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    targetRoles: ['zurich_admin', 'zurich_user']
  },
  {
    id: 6,
    type: 'error',
    title: 'Processing Failed',
    message: 'Unable to extract rules from uploaded chat log',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
    targetRoles: ['zurich_admin']
  },
  {
    id: 7,
    type: 'warning',
    title: 'Document Deletion Request',
    message: 'User john.broker@company.com requests deletion of "old-guidelines.pdf"',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    targetRoles: ['zurich_admin'],
    actionType: 'delete_document',
    actionData: {
      itemId: 123,
      itemType: 'document',
      itemName: 'old-guidelines.pdf',
      requestedBy: 'john.broker@company.com',
      reason: 'Document contains outdated information that may cause confusion'
    }
  },
  {
    id: 8,
    type: 'warning',
    title: 'Rule Deletion Request',
    message: 'User sarah.underwriter@zurich.com requests deletion of discount rule #456',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
    targetRoles: ['zurich_admin'],
    actionType: 'delete_rule',
    actionData: {
      itemId: 456,
      itemType: 'rule',
      itemName: 'Discount Rule #456',
      requestedBy: 'sarah.underwriter@zurich.com',
      reason: 'Rule conflicts with new regulatory requirements'
    }
  }
];

export default function NotificationsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // Filter notifications based on user role
  const filteredNotifications = notifications.filter(notification => 
    user?.role && notification.targetRoles.includes(user.role)
  );

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleApproveAction = async (notification: Notification) => {
    if (!notification.actionData) return;

    try {
      const endpoint = notification.actionData.itemType === 'document' 
        ? `/api/documents/${notification.actionData.itemId}` 
        : `/api/rules/${notification.actionData.itemId}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        toast({
          title: "Action completed",
          description: `${notification.actionData.itemName} has been deleted successfully.`,
        });
        
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Redirect to appropriate management page
        if (notification.actionData.itemType === 'document') {
          window.location.href = '/documents';
        } else {
          window.location.href = '/rules';
        }
      } else {
        toast({
          title: "Action failed",
          description: "Failed to complete the requested action.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: "An error occurred while processing the request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectAction = (notification: Notification) => {
    // Remove the notification (reject the request)
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    toast({
      title: "Request rejected",
      description: "The deletion request has been rejected.",
    });
  };

  const handleViewDetails = (notification: Notification) => {
    if (!notification.actionData) return;
    
    // Redirect to the appropriate management page to view the item
    if (notification.actionData.itemType === 'document') {
      window.location.href = '/documents';
    } else {
      window.location.href = '/rules';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {notification.actionData && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p><strong>Requested by:</strong> {notification.actionData.requestedBy}</p>
                        <p><strong>Reason:</strong> {notification.actionData.reason}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      {notification.actionType && notification.actionData && user?.role === 'zurich_admin' && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(notification);
                            }}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            title="View details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveAction(notification);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            title="Approve deletion"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectAction(notification);
                            }}
                            className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                            title="Reject request"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
