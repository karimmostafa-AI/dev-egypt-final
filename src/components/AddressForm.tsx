'use client';

import { useEffect } from 'react';
import { UseFormReturn, FieldPath } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface AddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressFormProps {
  form: UseFormReturn<any>;
  addressType: 'shipping' | 'billing';
  sameAsShipping?: boolean;
  onSameAsShippingChange?: (checked: boolean) => void;
  showSameAsShipping?: boolean;
  className?: string;
}

const AddressForm = ({
  form,
  addressType,
  sameAsShipping = false,
  onSameAsShippingChange,
  showSameAsShipping = false,
  className = ""
}: AddressFormProps) => {
  const addressPrefix = addressType === 'shipping' ? 'shippingAddress' : 'billingAddress';

  // Auto-populate billing address when "same as shipping" is checked
  useEffect(() => {
    if (sameAsShipping && addressType === 'billing') {
      const shippingValues = form.getValues('shippingAddress');
      form.setValue('billingAddress', shippingValues);
    }
  }, [sameAsShipping, addressType, form]);

  const renderField = (
    fieldName: keyof AddressData,
    label: string,
    placeholder: string,
    required: boolean = true
  ) => {
    const fullFieldName = `${addressPrefix}.${fieldName}` as FieldPath<any>;

    return (
      <FormField
        control={form.control}
        name={fullFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={placeholder}
                {...field}
                disabled={addressType === 'billing' && sameAsShipping}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (addressType === 'billing' && sameAsShipping) {
    return null; // Don't render billing form when same as shipping
  }

  return (
    <div className={className}>
      {showSameAsShipping && addressType === 'billing' && (
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <Checkbox
              checked={sameAsShipping}
              onCheckedChange={(checked) => onSameAsShippingChange?.(checked as boolean)}
            />
            <span className="text-sm font-medium text-gray-700">
              Same as shipping address
            </span>
          </label>
        </div>
      )}

      <div className="space-y-4">
        {renderField('addressLine1', 'Address Line 1', '123 Main Street')}

        {renderField('addressLine2', 'Address Line 2', 'Apartment, suite, etc.', false)}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderField('city', 'City', 'New York')}
          {renderField('state', 'State', 'NY')}
          {renderField('postalCode', 'ZIP Code', '10001')}
        </div>

        {renderField('country', 'Country', 'United States')}
      </div>
    </div>
  );
};

export default AddressForm;