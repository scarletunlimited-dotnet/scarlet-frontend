// Runtime validation utilities for API responses

export interface ValidationError {
  field: string;
  message: string;
  received: unknown;
  expected: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public received: unknown,
    public expected: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Type guards for basic types
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isDateString(value: unknown): value is string {
  return isString(value) && !isNaN(Date.parse(value));
}

// Validation functions
export function validateString(value: unknown, field: string): string {
  if (!isString(value)) {
    throw new ValidationError(
      `Expected string for field '${field}', received ${typeof value}`,
      field,
      value,
      'string'
    );
  }
  return value;
}

export function validateNumber(value: unknown, field: string): number {
  if (!isNumber(value)) {
    throw new ValidationError(
      `Expected number for field '${field}', received ${typeof value}`,
      field,
      value,
      'number'
    );
  }
  return value;
}

export function validateBoolean(value: unknown, field: string): boolean {
  if (!isBoolean(value)) {
    throw new ValidationError(
      `Expected boolean for field '${field}', received ${typeof value}`,
      field,
      value,
      'boolean'
    );
  }
  return value;
}

export function validateArray<T>(
  value: unknown,
  field: string,
  itemValidator: (item: unknown) => T
): T[] {
  if (!isArray(value)) {
    throw new ValidationError(
      `Expected array for field '${field}', received ${typeof value}`,
      field,
      value,
      'array'
    );
  }
  
  return value.map((item, index) => {
    try {
      return itemValidator(item);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid item at index ${index} in array '${field}': ${error.message}`,
          `${field}[${index}]`,
          item,
          'valid array item'
        );
      }
      throw error;
    }
  });
}

export function validateObject(
  value: unknown,
  field: string,
  schema: Record<string, (value: unknown) => unknown>
): Record<string, unknown> {
  if (!isObject(value)) {
    throw new ValidationError(
      `Expected object for field '${field}', received ${typeof value}`,
      field,
      value,
      'object'
    );
  }
  
  const result: Record<string, unknown> = {};
  
  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key] = validator(value[key]);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Invalid field '${key}' in object '${field}': ${error.message}`,
          `${field}.${key}`,
          value[key],
          'valid object field'
        );
      }
      throw error;
    }
  }
  
  return result;
}

export function validateOptional<T>(
  value: unknown,
  validator: (value: unknown) => T
): T | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return validator(value);
}

// API Response validation
export function validateApiResponse<T>(
  response: unknown,
  dataValidator: (data: unknown) => T
): { success: boolean; data: T; error?: { message: string; code?: string; field?: string } } {
  if (!isObject(response)) {
    throw new ValidationError(
      'Expected API response to be an object',
      'response',
      response,
      'object'
    );
  }
  
  const success = validateBoolean(response.success, 'success');
  
  if (success) {
    const data = dataValidator(response.data);
    return { success, data };
  } else {
    const error = response.error ? {
      message: validateString(response.error.message, 'error.message'),
      code: response.error.code ? validateString(response.error.code, 'error.code') : undefined,
      field: response.error.field ? validateString(response.error.field, 'error.field') : undefined,
    } : undefined;
    
    return { success, data: dataValidator(response.data), error };
  }
}

// Paginated response validation
export function validatePaginatedResponse<T>(
  response: unknown,
  itemValidator: (item: unknown) => T
): {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: { message: string; code?: string; field?: string };
} {
  const validated = validateApiResponse(response, (data) => {
    if (!isObject(data)) {
      throw new ValidationError('Expected data to be an object', 'data', data, 'object');
    }
    
    return {
      data: validateArray(data.data, 'data', itemValidator),
      meta: validateObject(data.meta, 'meta', {
        total: validateNumber,
        page: validateNumber,
        limit: validateNumber,
        totalPages: validateNumber,
      }),
    };
  });
  
  return {
    success: validated.success,
    data: validated.data.data,
    meta: validated.data.meta,
    error: validated.error,
  };
}

// Product validation
export function validateProduct(product: unknown): {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  price: {
    currency: string;
    amount: number;
    originalAmount?: number;
    discountPercentage?: number;
  };
  brand?: string;
  stock?: number;
  categoryIds: string[];
  attributes?: Array<{
    name: string;
    value: string | number | boolean;
    type: 'text' | 'number' | 'boolean' | 'select';
    displayName?: string;
  }>;
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  isActive?: boolean;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  rating?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
} {
  if (!isObject(product)) {
    throw new ValidationError('Expected product to be an object', 'product', product, 'object');
  }
  
  return {
    _id: validateString(product._id, '_id'),
    title: validateString(product.title, 'title'),
    slug: validateString(product.slug, 'slug'),
    description: validateOptional(validateString, product.description),
    shortDescription: validateOptional(validateString, product.shortDescription),
    images: validateArray(product.images, 'images', validateString),
    price: validateObject(product.price, 'price', {
      currency: validateString,
      amount: validateNumber,
      originalAmount: (value) => validateOptional(validateNumber, value),
      discountPercentage: (value) => validateOptional(validateNumber, value),
    }),
    brand: validateOptional(validateString, product.brand),
    stock: validateOptional(validateNumber, product.stock),
    categoryIds: validateArray(product.categoryIds, 'categoryIds', validateString),
    attributes: validateOptional((value) => 
      validateArray(value, 'attributes', (attr) => 
        validateObject(attr, 'attribute', {
          name: validateString,
          value: (value) => value,
          type: (value) => {
            const type = validateString(value, 'type');
            if (!['text', 'number', 'boolean', 'select'].includes(type)) {
              throw new ValidationError('Invalid attribute type', 'type', value, 'text | number | boolean | select');
            }
            return type as 'text' | 'number' | 'boolean' | 'select';
          },
          displayName: (value) => validateOptional(validateString, value),
        })
      ), product.attributes),
    tags: validateOptional((value) => validateArray(value, 'tags', validateString), product.tags),
    sku: validateOptional(validateString, product.sku),
    weight: validateOptional(validateNumber, product.weight),
    dimensions: validateOptional((value) => 
      validateObject(value, 'dimensions', {
        length: validateNumber,
        width: validateNumber,
        height: validateNumber,
        unit: (value) => {
          const unit = validateString(value, 'unit');
          if (!['cm', 'in'].includes(unit)) {
            throw new ValidationError('Invalid dimension unit', 'unit', value, 'cm | in');
          }
          return unit as 'cm' | 'in';
        },
      }), product.dimensions),
    isActive: validateOptional(validateBoolean, product.isActive),
    isFeatured: validateOptional(validateBoolean, product.isFeatured),
    seoTitle: validateOptional(validateString, product.seoTitle),
    seoDescription: validateOptional(validateString, product.seoDescription),
    createdAt: validateString(product.createdAt, 'createdAt'),
    updatedAt: validateString(product.updatedAt, 'updatedAt'),
  };
}

// User validation
export function validateUser(user: unknown): {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'staff' | 'monitor' | 'customer';
  isEmailVerified?: boolean;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: {
    newsletter: boolean;
    smsNotifications: boolean;
    language: string;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
} {
  if (!isObject(user)) {
    throw new ValidationError('Expected user to be an object', 'user', user, 'object');
  }
  
  return {
    _id: validateString(user._id, '_id'),
    email: validateString(user.email, 'email'),
    firstName: validateOptional(validateString, user.firstName),
    lastName: validateOptional(validateString, user.lastName),
    role: (() => {
      const role = validateString(user.role, 'role');
      if (!['admin', 'staff', 'monitor', 'customer'].includes(role)) {
        throw new ValidationError('Invalid user role', 'role', role, 'admin | staff | monitor | customer');
      }
      return role as 'admin' | 'staff' | 'monitor' | 'customer';
    })(),
    isEmailVerified: validateOptional(validateBoolean, user.isEmailVerified),
    avatar: validateOptional(validateString, user.avatar),
    phone: validateOptional(validateString, user.phone),
    dateOfBirth: validateOptional(validateString, user.dateOfBirth),
    preferences: validateOptional((value) => 
      validateObject(value, 'preferences', {
        newsletter: validateBoolean,
        smsNotifications: validateBoolean,
        language: validateString,
        currency: validateString,
      }), user.preferences),
    createdAt: validateString(user.createdAt, 'createdAt'),
    updatedAt: validateString(user.updatedAt, 'updatedAt'),
  };
}

// Order validation
export function validateOrder(order: unknown): {
  _id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  items: Array<{
    productId: string;
    title: string;
    slug: string;
    image: string;
    price: number;
    quantity: number;
    brand?: string;
    sku?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentInfo: {
    method: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    last4?: string;
    brand?: string;
  };
  shippingMethod: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
} {
  if (!isObject(order)) {
    throw new ValidationError('Expected order to be an object', 'order', order, 'object');
  }
  
  return {
    _id: validateString(order._id, '_id'),
    orderNumber: validateString(order.orderNumber, 'orderNumber'),
    userId: validateOptional(validateString, order.userId),
    email: validateString(order.email, 'email'),
    items: validateArray(order.items, 'items', (item) => 
      validateObject(item, 'orderItem', {
        productId: validateString,
        title: validateString,
        slug: validateString,
        image: validateString,
        price: validateNumber,
        quantity: validateNumber,
        brand: (value) => validateOptional(validateString, value),
        sku: (value) => validateOptional(validateString, value),
      })),
    subtotal: validateNumber(order.subtotal, 'subtotal'),
    shipping: validateNumber(order.shipping, 'shipping'),
    tax: validateNumber(order.tax, 'tax'),
    discount: validateNumber(order.discount, 'discount'),
    total: validateNumber(order.total, 'total'),
    currency: validateString(order.currency, 'currency'),
    status: (() => {
      const status = validateString(order.status, 'status');
      if (!['pending', 'confirmed', 'processing', 'delivered', 'cancelled', 'refunded'].includes(status)) {
        throw new ValidationError('Invalid order status', 'status', status, 'pending | confirmed | processing | delivered | cancelled | refunded');
      }
      return status as 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled' | 'refunded';
    })(),
    shippingAddress: validateObject(order.shippingAddress, 'shippingAddress', {
      firstName: validateString,
      lastName: validateString,
      address: validateString,
      address2: (value) => validateOptional(validateString, value),
      city: validateString,
      state: validateString,
      zipCode: validateString,
      country: validateString,
      phone: (value) => validateOptional(validateString, value),
    }),
    billingAddress: validateOptional((value) => 
      validateObject(value, 'billingAddress', {
        firstName: validateString,
        lastName: validateString,
        address: validateString,
        address2: (value) => validateOptional(validateString, value),
        city: validateString,
        state: validateString,
        zipCode: validateString,
        country: validateString,
        phone: (value) => validateOptional(validateString, value),
      }), order.billingAddress),
    paymentInfo: validateObject(order.paymentInfo, 'paymentInfo', {
      method: (value) => {
        const method = validateString(value, 'method');
        if (!['card', 'paypal', 'apple_pay', 'google_pay'].includes(method)) {
          throw new ValidationError('Invalid payment method', 'method', value, 'card | paypal | apple_pay | google_pay');
        }
        return method as 'card' | 'paypal' | 'apple_pay' | 'google_pay';
      },
      status: (value) => {
        const status = validateString(value, 'status');
        if (!['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)) {
          throw new ValidationError('Invalid payment status', 'status', value, 'pending | processing | completed | failed | refunded');
        }
        return status as 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
      },
      transactionId: (value) => validateOptional(validateString, value),
      last4: (value) => validateOptional(validateString, value),
      brand: (value) => validateOptional(validateString, value),
    }),
    shippingMethod: validateString(order.shippingMethod, 'shippingMethod'),
    deliveredAt: validateOptional(validateString, order.deliveredAt),
    notes: validateOptional(validateString, order.notes),
    createdAt: validateString(order.createdAt, 'createdAt'),
    updatedAt: validateString(order.updatedAt, 'updatedAt'),
  };
}

// Safe API call wrapper with validation
export async function safeApiCall<T>(
  apiCall: () => Promise<unknown>,
  validator: (data: unknown) => T
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const response = await apiCall();
    const validated = validateApiResponse(response, validator);
    return { success: true, data: validated.data };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: `Validation error: ${error.message} (field: ${error.field})` 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
