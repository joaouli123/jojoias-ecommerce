"use client";

import type { ComponentType, InputHTMLAttributes, SVGProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Hash, Home, Info, Landmark, Mail, MapPin, Phone, User } from "lucide-react";
import type { ShippingQuote } from "@/lib/shipping";
import { formatCurrency } from "@/lib/utils";
import { readStoredShippingSelection, writeStoredShippingSelection } from "@/lib/shipping-session";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatZipcode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: IconType }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        {...props}
        className="h-12 w-full rounded-[20px] border border-zinc-200 pl-10 pr-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
      />
    </div>
  );
}

type CheckoutFormFieldsProps = {
  subtotal: number;
  itemsCount: number;
  savedAddresses?: Array<{
    id: string;
    label: string | null;
    recipient: string;
    zipcode: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    complement: string | null;
  }>;
};

function emitShippingUpdate(quote: ShippingQuote | null) {
  window.dispatchEvent(new CustomEvent("shipping:updated", { detail: quote }));
}

function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function CheckoutFormFields({ subtotal, itemsCount, savedAddresses = [] }: CheckoutFormFieldsProps) {
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [complement, setComplement] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isLoadingZipcode, setIsLoadingZipcode] = useState(false);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [zipcodeMessage, setZipcodeMessage] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([]);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState("standard");
  const [shippingMessage, setShippingMessage] = useState("");

  const zipcodeDigits = useMemo(() => onlyDigits(zipcode), [zipcode]);
  const shouldShowAddressFields = zipcodeDigits.length === 8 || Boolean(street || number || district || city || stateCode || complement);
  const zipcodeStatusId = "checkout-zipcode-status";
  const shippingStatusId = "checkout-shipping-status";

  async function tryFetchAddress(rawZipcode: string) {
    const digits = onlyDigits(rawZipcode);

    if (digits.length !== 8) {
      setZipcodeMessage("");
      return;
    }

    setIsLoadingZipcode(true);
    setZipcodeMessage("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) {
        setZipcodeMessage("Não foi possível consultar o CEP agora.");
        return;
      }

      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (data.erro) {
        setZipcodeMessage("CEP não encontrado.");
        return;
      }

      setStreet(data.logradouro ?? "");
      setDistrict(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setStateCode(data.uf ?? "");
      setZipcodeMessage("Endereço preenchido automaticamente.");
    } catch {
      setZipcodeMessage("Não foi possível consultar o CEP agora.");
    } finally {
      setIsLoadingZipcode(false);
    }
  }

  const tryFetchShipping = useCallback(async (rawZipcode: string, preferredOptionId?: string) => {
    const digits = onlyDigits(rawZipcode);

    if (digits.length !== 8) {
      setShippingQuote(null);
      setShippingMessage("");
      emitShippingUpdate(null);
      return;
    }

    setIsLoadingShipping(true);
    setShippingMessage("");

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipcode: digits, subtotal, itemsCount }),
      });

      const payload = (await response.json()) as { error?: string; quote?: ShippingQuote; options?: ShippingQuote[] };

      if (!response.ok || !payload.quote) {
        setShippingQuote(null);
        setShippingOptions([]);
        setShippingMessage(payload.error ?? "Não foi possível calcular o frete agora.");
        emitShippingUpdate(null);
        return;
      }

      const nextOptions = payload.options ?? [payload.quote];
      const nextSelected = nextOptions.find((option) => option.id === preferredOptionId)
        ?? nextOptions.find((option) => option.id === selectedShippingId)
        ?? nextOptions[0];

      setShippingOptions(nextOptions);
      setShippingQuote(nextSelected);
      setSelectedShippingId(nextSelected.id);
      setShippingMessage(nextSelected.isFree ? "Seu pedido já saiu com frete grátis." : "Frete calculado com sucesso.");
      writeStoredShippingSelection({ zipcode: digits, optionId: nextSelected.id });
      emitShippingUpdate(nextSelected);
    } catch {
      setShippingQuote(null);
      setShippingOptions([]);
      setShippingMessage("Não foi possível calcular o frete agora.");
      emitShippingUpdate(null);
    } finally {
      setIsLoadingShipping(false);
    }
  }, [itemsCount, selectedShippingId, subtotal]);

  function handleZipcodeChange(value: string) {
    const formatted = formatZipcode(value);
    setZipcode(formatted);
    setSelectedAddressId("");

    const digits = onlyDigits(formatted);
    if (digits.length === 8) {
      void tryFetchAddress(formatted);
      void tryFetchShipping(formatted);
    } else {
      setZipcodeMessage("");
      setShippingOptions([]);
      setShippingQuote(null);
      setShippingMessage("");
      setStreet("");
      setNumber("");
      setDistrict("");
      setCity("");
      setStateCode("");
      setComplement("");
      emitShippingUpdate(null);
    }
  }

  function handleSelectSavedAddress(addressId: string) {
    setSelectedAddressId(addressId);
    const address = savedAddresses.find((item) => item.id === addressId);

    if (!address) return;

    setZipcode(formatZipcode(address.zipcode));
    setStreet(address.street);
    setNumber(address.number);
    setDistrict(address.district);
    setCity(address.city);
    setStateCode(address.state);
    setComplement(address.complement || "");
    setZipcodeMessage("Endereço carregado da sua conta.");
    void tryFetchShipping(address.zipcode);
  }

  function handleShippingSelection(optionId: string) {
    setSelectedShippingId(optionId);
    const option = shippingOptions.find((item) => item.id === optionId) ?? null;
    setShippingQuote(option);
    if (option) {
      writeStoredShippingSelection({ zipcode: option.zipcode, optionId: option.id });
    }
    emitShippingUpdate(option);
  }

  useEffect(() => {
    if (zipcode || selectedAddressId) return;

    const saved = readStoredShippingSelection();
    if (!saved?.zipcode) return;

    const formattedZipcode = formatZipcode(saved.zipcode);
    setZipcode(formattedZipcode);
    void tryFetchAddress(formattedZipcode);
    void tryFetchShipping(formattedZipcode, saved.optionId);
  }, [selectedAddressId, tryFetchShipping, zipcode]);

  return (
    <>
      <section className="rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6" aria-labelledby="checkout-customer-heading">
        <h2 id="checkout-customer-heading" className="mb-4 text-xl font-bold text-zinc-900">Dados do cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithIcon
            icon={User}
            name="name"
            required
            placeholder="Nome completo"
            autoComplete="name"
            aria-label="Nome completo"
          />
          <InputWithIcon
            icon={Mail}
            name="email"
            type="email"
            required
            placeholder="E-mail"
            autoComplete="email"
            aria-label="E-mail"
          />
          <InputWithIcon
            icon={CreditCard}
            name="document"
            required
            placeholder="CPF"
            value={document}
            onChange={(event) => setDocument(formatDocument(event.target.value))}
            inputMode="numeric"
            aria-label="CPF"
          />
          <InputWithIcon
            icon={Phone}
            name="phone"
            placeholder="Telefone/WhatsApp"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            autoComplete="tel"
            inputMode="tel"
            aria-label="Telefone ou WhatsApp"
            className="md:col-span-1"
          />
        </div>
      </section>

      <section className="rounded-[20px] border border-zinc-200 bg-white p-5 md:p-6" aria-labelledby="checkout-address-heading">
        <h2 id="checkout-address-heading" className="mb-4 text-xl font-bold text-zinc-900">Endereço de entrega</h2>

        {savedAddresses.length ? (
          <div className="mb-5 space-y-3 rounded-[20px] border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Usar endereço salvo</p>
              <p className="text-xs text-zinc-500">Selecione um endereço já cadastrado para preencher o checkout automaticamente.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {savedAddresses.map((address) => (
                <label key={address.id} className={`cursor-pointer rounded-[20px] border p-4 text-sm transition-colors ${selectedAddressId === address.id ? "border-[#D4AF37] bg-white" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="savedAddressOption"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => handleSelectSavedAddress(address.id)}
                      className="mt-0.5 accent-[#111111]"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900">{address.label || address.recipient}</p>
                      <p className="mt-1 text-zinc-600">{address.street}, {address.number}</p>
                      <p className="text-zinc-600">{address.district} • {address.city}/{address.state}</p>
                      <p className="text-zinc-500">CEP {address.zipcode}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <InputWithIcon
            icon={MapPin}
            name="zipcode"
            required
            placeholder="CEP"
            value={zipcode}
            onChange={(event) => handleZipcodeChange(event.target.value)}
            autoComplete="postal-code"
            inputMode="numeric"
            aria-label="CEP"
            aria-describedby={zipcodeDigits.length >= 8 ? zipcodeStatusId : undefined}
            className="md:col-span-2"
          />
        </div>

        {zipcodeDigits.length < 8 ? (
          <p className="mt-3 text-sm text-zinc-500">Digite o CEP para carregar o endereço automaticamente e depois confirmar ou complementar os dados.</p>
        ) : null}

        {shouldShowAddressFields ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
            <InputWithIcon
              icon={Home}
              name="street"
              required
              placeholder="Rua"
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              autoComplete="address-line1"
              aria-label="Rua"
              className="md:col-span-4"
            />
            <InputWithIcon
              icon={Hash}
              name="number"
              required
              placeholder="Número"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              autoComplete="address-line2"
              aria-label="Número"
              className="md:col-span-2"
            />
            <InputWithIcon
              icon={Building2}
              name="district"
              required
              placeholder="Bairro"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              autoComplete="address-level3"
              aria-label="Bairro"
              className="md:col-span-2"
            />
            <InputWithIcon
              icon={Building2}
              name="city"
              required
              placeholder="Cidade"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              autoComplete="address-level2"
              aria-label="Cidade"
              className="md:col-span-2"
            />
            <InputWithIcon
              icon={Landmark}
              name="state"
              required
              placeholder="Estado"
              value={stateCode}
              onChange={(event) => setStateCode(event.target.value.toUpperCase().slice(0, 2))}
              autoComplete="address-level1"
              aria-label="Estado"
              className="md:col-span-2"
            />
            <InputWithIcon
              icon={Info}
              name="complement"
              placeholder="Complemento (opcional)"
              value={complement}
              onChange={(event) => setComplement(event.target.value)}
              autoComplete="additional-address-line"
              aria-label="Complemento"
              className="md:col-span-4"
            />
          </div>
        ) : null}

        {(isLoadingZipcode || zipcodeMessage) && zipcodeDigits.length >= 8 ? (
          <p id={zipcodeStatusId} className="mt-3 text-xs font-medium text-zinc-500" aria-live="polite" aria-atomic="true">
            {isLoadingZipcode ? "Buscando endereço pelo CEP..." : zipcodeMessage}
          </p>
        ) : null}

        {(isLoadingShipping || shippingMessage || shippingQuote) && zipcodeDigits.length >= 8 ? (
          <div className="mt-4 rounded-[20px] border border-zinc-200 bg-zinc-50 p-4 text-sm" aria-labelledby="checkout-shipping-heading" aria-describedby={shippingStatusId}>
            <p id="checkout-shipping-heading" className="font-semibold text-zinc-900">Frete do pedido</p>
            <p id={shippingStatusId} className="sr-only" aria-live="polite" aria-atomic="true">
              {isLoadingShipping ? "Calculando frete para este CEP..." : shippingMessage || (shippingQuote ? `Frete selecionado: ${shippingQuote.service} por ${formatCurrency(shippingQuote.amount)}.` : "")}
            </p>
            {isLoadingShipping ? (
              <p className="mt-1 text-zinc-500">Calculando frete para este CEP...</p>
            ) : shippingOptions.length ? (
              <>
                <input type="hidden" name="shippingOptionId" value={selectedShippingId} />
                <div className="mt-3 space-y-3" role="radiogroup" aria-label="Opções de frete">
                  {shippingOptions.map((option) => (
                    <label key={option.id} className={`block cursor-pointer rounded-[20px] border p-4 transition-colors ${selectedShippingId === option.id ? "border-[#D4AF37] bg-white" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingOptionSelector"
                          value={option.id}
                          checked={selectedShippingId === option.id}
                          onChange={() => handleShippingSelection(option.id)}
                          aria-label={`${option.service}, ${formatCurrency(option.amount)}, entrega em até ${option.estimatedDays} dias úteis`}
                          className="mt-0.5 accent-[#111111]"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold text-zinc-900">{option.service}</p>
                            <p className="font-bold text-zinc-900">{formatCurrency(option.amount)}</p>
                          </div>
                          <p className="mt-1 text-zinc-600">{option.region} • até {option.estimatedDays} dias úteis.</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {shippingQuote?.missingForFree ? (
                  <p className="mt-3 text-emerald-700">Faltam {formatCurrency(shippingQuote.missingForFree)} para frete grátis na entrega padrão.</p>
                ) : null}
              </>
            ) : shippingMessage ? (
              <p className="mt-1 text-red-600">{shippingMessage}</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
