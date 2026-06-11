'use client'
import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AddressResponse, CreateAddressRequest } from '@/lib/api-types'

const inputClass =
  'w-full rounded-xl border border-ap-gray2 bg-ap-gray1 px-4 py-2.5 text-sm text-ap-black placeholder:text-ap-text3 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20'

interface AddressSectionProps {
  addresses?: AddressResponse[]
  selectedAddressId: string | null
  onSelectAddress: (id: string) => void
  showForm: boolean
  onShowForm: () => void
  onHideForm: () => void
  form: CreateAddressRequest
  onFormChange: (form: CreateAddressRequest) => void
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
}

export function AddressSection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  showForm,
  onShowForm,
  onHideForm,
  form,
  onFormChange,
  onSubmit,
  isSaving,
}: AddressSectionProps) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ap-black">
        <MapPin className="h-5 w-5 text-accent" /> Shipping Address
      </h2>

      {addresses && addresses.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                selectedAddressId === addr.id
                  ? 'border-accent bg-blue-50'
                  : 'border-ap-gray2 hover:border-ap-gray3'
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === addr.id}
                onChange={() => onSelectAddress(addr.id)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-semibold text-ap-black">
                  {addr.label} · {addr.fullName}
                  {addr.isDefault && (
                    <span className="ml-2 rounded-full bg-ap-gray2 px-2 py-0.5 text-[10px] font-semibold uppercase text-ap-text2">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-ap-text2">{addr.phone}</p>
                <p className="text-ap-text2">
                  {addr.addressLine}, {addr.city}
                  {addr.region ? `, ${addr.region}` : ''}
                  {addr.postalCode ? ` ${addr.postalCode}` : ''}, {addr.country}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={onShowForm}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <Plus className="h-4 w-4" /> Add a new address
        </button>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-ap-gray2 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
              className={inputClass}
            />
            <input
              required
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <input
            required
            placeholder="Address line"
            value={form.addressLine}
            onChange={(e) => onFormChange({ ...form, addressLine: e.target.value })}
            className={inputClass}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => onFormChange({ ...form, city: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Region"
              value={form.region}
              onChange={(e) => onFormChange({ ...form, region: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Postal code"
              value={form.postalCode}
              onChange={(e) => onFormChange({ ...form, postalCode: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Label (e.g. Home, Work)"
              value={form.label}
              onChange={(e) => onFormChange({ ...form, label: e.target.value })}
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm text-ap-text2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => onFormChange({ ...form, isDefault: e.target.checked })}
              />
              Set as default address
            </label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSaving}>
              Save Address
            </Button>
            {addresses && addresses.length > 0 && (
              <Button type="button" variant="outline" onClick={onHideForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
