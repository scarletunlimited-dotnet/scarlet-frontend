"use client";

import * as React from 'react';
import { 
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  TagIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export default function EmptyState({ 
  icon: Icon = DocumentTextIcon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
            action.variant === 'primary'
              ? 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              : 'text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
          }`}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
}

// Predefined empty states for common admin scenarios
export function EmptyUsersState({ onCreateUser }: { onCreateUser: () => void }) {
  return (
    <EmptyState
      icon={UserGroupIcon}
      title="No Users Found"
      description="There are no users in the system yet. Create your first user to get started."
      action={{
        label: "Create User",
        onClick: onCreateUser,
        variant: "primary"
      }}
    />
  );
}

export function EmptyProductsState({ onCreateProduct }: { onCreateProduct?: () => void }) {
  return (
    <EmptyState
      icon={ShoppingBagIcon}
      title="No Products Found"
      description="Your product catalog is empty. Add your first product to start selling."
      action={onCreateProduct ? {
        label: "Add Product",
        onClick: onCreateProduct,
        variant: "primary"
      } : undefined}
    />
  );
}

export function EmptyOrdersState() {
  return (
    <EmptyState
      icon={ShoppingBagIcon}
      title="No Orders Yet"
      description="Orders will appear here once customers start making purchases."
    />
  );
}

export function EmptyCategoriesState({ onCreateCategory }: { onCreateCategory: () => void }) {
  return (
    <EmptyState
      icon={TagIcon}
      title="No Categories Found"
      description="Create categories to organize your products and make them easier to find."
      action={{
        label: "Create Category",
        onClick: onCreateCategory,
        variant: "primary"
      }}
    />
  );
}

export function EmptyLogsState() {
  return (
    <EmptyState
      icon={DocumentTextIcon}
      title="No Activity Logs"
      description="Activity logs will appear here as you and your team perform actions in the admin panel."
    />
  );
}

export function EmptySearchState({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={ExclamationTriangleIcon}
      title="No Results Found"
      description={`No items match your search for "${searchTerm}". Try adjusting your search terms.`}
    />
  );
}
