"use client";

import { useCallback, useEffect, useState } from "react";

type Row = Record<string, any>;

type TaxData = {
  salesSummary: Row | null;
  profile: Row | null;
  rules: Row[];
  obligations: Row[];
  purchases: Row[];
  returns: Row[];
  payments: Row[];
  deadlines: Row[];
  adjustments: Row[];
};

const emptyData: TaxData = {
  salesSummary: null,
  profile: null,
  rules: [],
  obligations: [],
  purchases: [],
  returns: [],
  payments: [],
  deadlines: [],
  adjustments: [],
};

const money = (value: unknown) =>
  `TZS ${Number(value || 0).toLocaleString("en-TZ", {
    maximumFractionDigits: 2,
  })}`;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const labelClass = "mb-1 block text-xs font-semibold text-slate-600";

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-xl font-bold text-slate-800">
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: { label: string; render: (row: Row) => React.ReactNode }[];
  rows: Row[];
  empty: string;
}) {
  if (!rows.length) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.label}
                className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={String(row.id ?? row.purchase_reference ?? index)}
              className="border-b border-slate-100 last:border-0"
            >
              {columns.map((column) => (
                <td key={column.label} className="px-3 py-3 text-slate-700">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TaxManagementModule() {
  const [data, setData] = useState<TaxData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [section, setSection] = useState("Overview");

  const [profile, setProfile] = useState({
    business_name: "Gamora Online",
    registration_status: "pre_registration",
    registration_number: "",
    tin: "",
    vat_registered: false,
    vat_number: "",
    business_address: "",
    notes: "",
  });

  const [purchase, setPurchase] = useState({
    supplier_name: "",
    supplier_contact: "",
    supplier_tin: "",
    order_number: "",
    purchase_reference: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    other_costs: "0",
    discount_amount: "0",
    payment_status: "unpaid",
    purchase_status: "recorded",
    receipt_url: "",
    notes: "",
  });

  const [items, setItems] = useState([
    { product_name: "", product_id: "", quantity: "1", unit_cost: "0", discount_amount: "0" },
  ]);

  const [taxRule, setTaxRule] = useState({
    rule_name: "",
    tax_type: "Income Tax",
    rate: "",
    calculation_method: "manual",
    source_name: "",
    source_url: "",
    effective_from: "",
    effective_to: "",
    notes: "",
    verified: false,
    verification_confirmed: false,
  });

  const [obligation, setObligation] = useState({
    obligation_name: "",
    tax_type: "Income Tax",
    tax_rule_id: "",
    status: "unverified",
    period_type: "annual",
    effective_from: "",
    effective_to: "",
    notes: "",
    verification_confirmed: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin-new/tax-management", {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Imeshindikana kupakia taarifa za kodi.");
      }

      const next: TaxData = {
        salesSummary: json.salesSummary ?? null,
        profile: json.profile ?? null,
        rules: json.rules ?? [],
        obligations: json.obligations ?? [],
        purchases: json.purchases ?? [],
        returns: json.returns ?? [],
        payments: json.payments ?? [],
        deadlines: json.deadlines ?? [],
        adjustments: json.adjustments ?? [],
      };

      setData(next);

      if (next.profile) {
        setProfile({
          business_name: next.profile.business_name ?? "Gamora Online",
          registration_status: next.profile.registration_status ?? "pre_registration",
          registration_number: next.profile.registration_number ?? "",
          tin: next.profile.tin ?? "",
          vat_registered: next.profile.vat_registered === true,
          vat_number: next.profile.vat_number ?? "",
          business_address: next.profile.business_address ?? "",
          notes: next.profile.notes ?? "",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kupakia taarifa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const postAction = async (body: Row) => {
    const response = await fetch("/api/admin-new/tax-management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error || "Imeshindikana kuhifadhi taarifa.");
    }

    return json;
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await postAction({ action: "save_profile", ...profile });
      setMessage("Taarifa za biashara zimehifadhiwa.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuhifadhi profile.");
    } finally {
      setSaving(false);
    }
  };

  const savePurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await postAction({
        action: "create_purchase",
        ...purchase,
        items: items.map((item) => ({
          product_name: item.product_name,
          product_id: item.product_id || null,
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
          discount_amount: Number(item.discount_amount),
        })),
      });

      setMessage("Manunuzi yamehifadhiwa.");
      setPurchase({
        supplier_name: "",
        supplier_contact: "",
        supplier_tin: "",
        order_number: "",
        purchase_reference: "",
        purchase_date: new Date().toISOString().slice(0, 10),
        other_costs: "0",
        discount_amount: "0",
        payment_status: "unpaid",
        purchase_status: "recorded",
        receipt_url: "",
        notes: "",
      });
      setItems([
        { product_name: "", product_id: "", quantity: "1", unit_cost: "0", discount_amount: "0" },
      ]);
      await loadData();
      setSection("Supplier Purchases");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuhifadhi manunuzi.");
    } finally {
      setSaving(false);
    }
  };

  const saveTaxRule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await postAction({
        action: "save_tax_rule",
        ...taxRule,
        rate: taxRule.rate === "" ? null : Number(taxRule.rate),
      });
      setMessage("Tax rule imehifadhiwa.");
      setTaxRule({
        rule_name: "",
        tax_type: "Income Tax",
        rate: "",
        calculation_method: "manual",
        source_name: "",
        source_url: "",
        effective_from: "",
        effective_to: "",
        notes: "",
        verified: false,
        verification_confirmed: false,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuhifadhi tax rule.");
    } finally {
      setSaving(false);
    }
  };

  const saveObligation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await postAction({
        action: "save_obligation",
        ...obligation,
        tax_rule_id: obligation.tax_rule_id || null,
      });
      setMessage("Tax obligation imehifadhiwa.");
      setObligation({
        obligation_name: "",
        tax_type: "Income Tax",
        tax_rule_id: "",
        status: "unverified",
        period_type: "annual",
        effective_from: "",
        effective_to: "",
        notes: "",
        verification_confirmed: false,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Imeshindikana kuhifadhi tax obligation.");
    } finally {
      setSaving(false);
    }
  };

  const updatePurchase = (key: string, value: string) => {
    setPurchase((previous) => ({ ...previous, [key]: value }));
  };

  const updateItem = (index: number, key: string, value: string) => {
    setItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const purchaseSubtotal = items.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_cost) || 0);
  }, 0);

  const itemDiscount = items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.discount_amount) || 0),
    0
  );

  const purchaseTotal = Math.max(
    0,
    purchaseSubtotal +
      Math.max(0, Number(purchase.other_costs) || 0) -
      itemDiscount -
      Math.max(0, Number(purchase.discount_amount) || 0)
  );

  const sections = [
    "Overview",
    "Sample Calculation",
    "Business Profile",
    "Supplier Purchases",
    "Tax Obligations",
    "Returns & Payments",
    "Deadlines & Adjustments",
  ];

  const pendingObligations = data.obligations.filter(
    (item) => ["unverified", "under_review"].includes(item.status)
  ).length;

  const outstandingReturns = data.returns.filter(
    (item) => ["draft", "ready_for_review", "rejected"].includes(item.status)
  ).length;

  const verifiedRules = data.rules.filter((item) => item.verified === true).length;

  if (loading && !data.profile && !data.purchases.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Inapakia Tax Management...
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-800">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            GAMORA ONLINE
          </p>
          <h1 className="mt-1 text-xl font-bold">Tax Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Business profile, supplier purchases and tax records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading || saving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh Records
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setSection(item);
              setError("");
              setMessage("");
            }}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
              section === item
                ? "bg-emerald-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {section === "Overview" && (
        <div className="space-y-5">
          <Panel
            title="Live Sales & Tax Estimate"
            description="Calculated from Gamora orders, order items, paid payments and recorded expenses. Refresh the page to reload current data."
          >
            {data.salesSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    title="Sales This Month"
                    value={money(data.salesSummary.monthly?.sales)}
                    note={`${Number(data.salesSummary.monthly?.order_count || 0)} non-cancelled orders`}
                  />
                  <Stat
                    title="Sales This Year"
                    value={money(data.salesSummary.yearly?.sales)}
                    note="Order subtotal; delivery shown separately"
                  />
                  <Stat
                    title="Paid Amount This Month"
                    value={money(data.salesSummary.monthly?.cash_received)}
                    note="Recorded payments marked Paid"
                  />
                  <Stat
                    title="Estimated Profit This Month"
                    value={money(data.salesSummary.monthly?.estimated_profit_before_tax)}
                    note="Before income tax; based on recorded costs"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    title="Cost Of Goods Sold — Month"
                    value={money(data.salesSummary.monthly?.cost_of_goods_sold)}
                    note="Uses saved cost_price_at_sale"
                  />
                  <Stat
                    title="Recorded Expenses — Month"
                    value={money(data.salesSummary.monthly?.recorded_expenses)}
                    note="Expenses dated this month"
                  />
                  <Stat
                    title="Lifetime Estimated Profit"
                    value={money(data.salesSummary.lifetime?.estimated_profit_before_tax)}
                    note="Before tax; not a filed tax return"
                  />
                  <Stat
                    title="Income Tax Estimate"
                    value={data.salesSummary.estimated_income_tax == null
                      ? "Not configured"
                      : money(data.salesSummary.estimated_income_tax)}
                    note={data.salesSummary.income_tax_rule_verified
                      ? "Uses a verified rule marked applicable"
                      : "Needs an applicable, verified tax rule"}
                  />
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">VAT reference only — not VAT payable</p>
                  <p className="mt-1">
                    Reference rate: {Number(data.salesSummary.vat_reference_rate || 0) * 100}%.
                    Lifetime sales reference: {money(data.salesSummary.vat_reference_amount)}.
                    {data.salesSummary.vat_registered
                      ? " VAT registration is marked on the business profile; confirm the correct VAT treatment with TRA."
                      : " VAT registration is not marked on the profile. This figure is informational only and is not added to customer checkout."}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {data.salesSummary.monthly?.cost_data_note || "Profit is an estimate."}
                  {" "}Supplier stock purchases are not deducted again here, avoiding double-counting against item costs.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sales figures are not available yet. Reload the page or check the tax API permissions.</p>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              title="Registration Status"
              value={
                data.profile?.registration_status === "registered"
                  ? "Registered"
                  : data.profile?.registration_status === "suspended"
                    ? "Suspended"
                    : "Pre-registration"
              }
              note="Business profile"
            />
            <Stat title="Supplier Purchases" value={String(data.purchases.length)} note={money(data.purchases.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)) + " recorded"} />
            <Stat title="Obligations To Review" value={String(pendingObligations)} note="Unverified or under review" />
            <Stat title="Returns To Review" value={String(outstandingReturns)} note="Draft, review or rejected" />
          </div>

          <Panel
            title="Tax Readiness"
            description="Keep business and tax records organised before filing or making tax payments."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold">Business profile</p>
                <p className="mt-1 text-sm text-slate-500">
                  {data.profile ? "Profile saved" : "Profile not saved yet"}
                </p>
                <button type="button" onClick={() => setSection("Business Profile")} className="mt-3 text-sm font-bold text-emerald-700 hover:underline">
                  Open profile
                </button>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold">Tax rules verified</p>
                <p className="mt-1 text-sm text-slate-500">
                  {verifiedRules} of {data.rules.length} rules marked verified
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Do not treat unverified rules as confirmed tax advice.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Recent Supplier Purchases">
            <DataTable
              rows={data.purchases.slice(0, 5)}
              empty="No supplier purchases have been recorded yet."
              columns={[
                { label: "Reference", render: (row) => row.purchase_reference },
                { label: "Supplier", render: (row) => row.supplier_name },
                { label: "Date", render: (row) => row.purchase_date },
                { label: "Total", render: (row) => money(row.total_amount) },
                { label: "Payment", render: (row) => row.payment_status },
              ]}
            />
          </Panel>
        </div>
      )}

      {section === "Sample Calculation" && (
        <div className="space-y-5">
          <Panel
            title="Sample Tax Calculation"
            description="Mfano wa mahesabu ya mwezi. Hizi si takwimu halisi za mauzo ya Gamora."
          >
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-bold text-amber-900">
                DEMO ONLY — NOT ACTUAL BUSINESS RECORDS
              </p>
              <p className="mt-1 text-xs text-amber-800">
                Kiwango cha 10% ni cha majaribio tu, si uthibitisho wa kiwango cha kodi kinachotumika kwa Gamora.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                title="Sample Sales"
                value={money(5000000)}
                note="Mauzo ya mfano"
              />
              <Stat
                title="Delivery Income"
                value={money(200000)}
                note="Mapato ya usafirishaji ya mfano"
              />
              <Stat
                title="Cost Of Goods Sold"
                value={money(2800000)}
                note="Gharama za bidhaa zilizouzwa"
              />
              <Stat
                title="Operating Expenses"
                value={money(500000)}
                note="Matumizi ya biashara ya mfano"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Stat
                title="Profit Before Tax"
                value={money(1900000)}
                note="5,000,000 + 200,000 − 2,800,000 − 500,000"
              />
              <Stat
                title="Sample Tax Rate"
                value="10%"
                note="Kiwango cha mfano pekee"
              />
              <Stat
                title="Sample Income Tax"
                value={money(190000)}
                note="1,900,000 × 10%"
              />
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-800">
                Sample Profit After Tax
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {money(1710000)}
              </p>
              <p className="mt-2 text-xs text-emerald-800">
                1,900,000 − 190,000 = 1,710,000 TZS
              </p>
            </div>
          </Panel>

          <Panel
            title="VAT Reference — Demo Only"
            description="Rejea ya hesabu pekee; si VAT inayodaiwa na Gamora."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Stat
                title="Sample Sales"
                value={money(5000000)}
              />
              <Stat
                title="VAT Reference at 18%"
                value={money(900000)}
                note="5,000,000 × 18%. Si VAT payable."
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Kwa kuwa Gamora haijasajiliwa VAT kulingana na taarifa yako,
              thamani hii ni rejea tu. Haiongezwi kwenye checkout na haionyeshwi
              kama kodi ya kulipa.
            </p>
          </Panel>
        </div>
      )}

      {section === "Business Profile" && (
        <Panel
          title="Business Tax Profile"
          description="Save accurate business details. Leave registration numbers blank if they have not been issued."
        >
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name" value={profile.business_name} onChange={(value) => setProfile((p) => ({ ...p, business_name: value }))} />
              <SelectField
                label="Registration Status"
                value={profile.registration_status}
                onChange={(value) => setProfile((p) => ({ ...p, registration_status: value }))}
                options={[
                  { value: "pre_registration", label: "Pre-registration" },
                  { value: "registered", label: "Registered" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
              <Field label="Registration Number (if issued)" value={profile.registration_number} onChange={(value) => setProfile((p) => ({ ...p, registration_number: value }))} />
              <Field label="TIN (if issued)" value={profile.tin} onChange={(value) => setProfile((p) => ({ ...p, tin: value }))} />
              <Field label="VAT Number (if applicable)" value={profile.vat_number} onChange={(value) => setProfile((p) => ({ ...p, vat_number: value }))} />
              <Field label="Business Address" value={profile.business_address} onChange={(value) => setProfile((p) => ({ ...p, business_address: value }))} />
            </div>

            <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={profile.vat_registered}
                onChange={(event) => setProfile((p) => ({ ...p, vat_registered: event.target.checked }))}
                className="h-4 w-4 accent-emerald-700"
              />
              VAT registration has been confirmed
            </label>

            <label className="block">
              <span className={labelClass}>Notes</span>
              <textarea
                className={inputClass}
                rows={3}
                value={profile.notes}
                onChange={(event) => setProfile((p) => ({ ...p, notes: event.target.value }))}
                placeholder="Additional registration or tax administration notes"
              />
            </label>

            <button disabled={saving} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
              {saving ? "Saving..." : "Save Business Profile"}
            </button>
          </form>
        </Panel>
      )}

      {section === "Supplier Purchases" && (
        <div className="space-y-5">
          <Panel
            title="Record Supplier Purchase"
            description="Record the actual cost of products bought to fulfil customer orders. Totals are calculated by the server."
          >
            <form onSubmit={savePurchase} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Supplier Name *" value={purchase.supplier_name} onChange={(value) => updatePurchase("supplier_name", value)} />
                <Field label="Supplier Contact" value={purchase.supplier_contact} onChange={(value) => updatePurchase("supplier_contact", value)} />
                <Field label="Supplier TIN (if available)" value={purchase.supplier_tin} onChange={(value) => updatePurchase("supplier_tin", value)} />
                <Field label="Purchase Reference (optional)" value={purchase.purchase_reference} onChange={(value) => updatePurchase("purchase_reference", value)} placeholder="Auto-generated if blank" />
                <Field label="Linked Order Number (optional)" value={purchase.order_number} onChange={(value) => updatePurchase("order_number", value)} />
                <Field label="Purchase Date *" type="date" value={purchase.purchase_date} onChange={(value) => updatePurchase("purchase_date", value)} />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">Items Purchased</h3>
                  <button
                    type="button"
                    onClick={() => setItems((previous) => [...previous, { product_name: "", product_id: "", quantity: "1", unit_cost: "0", discount_amount: "0" }])}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 p-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <Field label="Product Name *" value={item.product_name} onChange={(value) => updateItem(index, "product_name", value)} />
                        <Field label="Product ID (optional)" value={item.product_id} onChange={(value) => updateItem(index, "product_id", value)} />
                        <Field label="Quantity *" type="number" value={item.quantity} onChange={(value) => updateItem(index, "quantity", value)} />
                        <Field label="Unit Cost (TZS) *" type="number" value={item.unit_cost} onChange={(value) => updateItem(index, "unit_cost", value)} />
                        <Field label="Item Discount (TZS)" type="number" value={item.discount_amount} onChange={(value) => updateItem(index, "discount_amount", value)} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">Line total: <strong>{money(Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unit_cost) || 0) - Math.max(0, Number(item.discount_amount) || 0))}</strong></p>
                        {items.length > 1 && (
                          <button type="button" onClick={() => setItems((previous) => previous.filter((_, i) => i !== index))} className="text-xs font-semibold text-red-600 hover:underline">
                            Remove item
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Other Costs (TZS)" type="number" value={purchase.other_costs} onChange={(value) => updatePurchase("other_costs", value)} />
                <Field label="Additional Purchase Discount (TZS)" type="number" value={purchase.discount_amount} onChange={(value) => updatePurchase("discount_amount", value)} />
                <SelectField
                  label="Supplier Payment Status"
                  value={purchase.payment_status}
                  onChange={(value) => updatePurchase("payment_status", value)}
                  options={[
                    { value: "unpaid", label: "Unpaid" },
                    { value: "partially_paid", label: "Partially Paid" },
                    { value: "paid", label: "Paid" },
                  ]}
                />
                <SelectField
                  label="Purchase Status"
                  value={purchase.purchase_status}
                  onChange={(value) => updatePurchase("purchase_status", value)}
                  options={[
                    { value: "recorded", label: "Recorded" },
                    { value: "received", label: "Received" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                />
                <Field label="Receipt URL (optional)" value={purchase.receipt_url} onChange={(value) => updatePurchase("receipt_url", value)} />
              </div>

              <label className="block">
                <span className={labelClass}>Notes</span>
                <textarea className={inputClass} rows={2} value={purchase.notes} onChange={(event) => updatePurchase("notes", event.target.value)} />
              </label>

              <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  <p>Items subtotal: <strong>{money(purchaseSubtotal)}</strong></p>
                  <p>Item discounts: <strong>{money(itemDiscount)}</strong></p>
                  <p className="mt-1 text-base text-slate-900">Estimated total: <strong>{money(purchaseTotal)}</strong></p>
                </div>
                <button disabled={saving} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Supplier Purchase"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Purchase History">
            <DataTable
              rows={data.purchases}
              empty="No supplier purchases recorded."
              columns={[
                { label: "Reference", render: (row) => row.purchase_reference },
                { label: "Supplier", render: (row) => row.supplier_name },
                { label: "Order", render: (row) => row.order_number || "—" },
                { label: "Date", render: (row) => row.purchase_date },
                { label: "Total", render: (row) => money(row.total_amount) },
                { label: "Status", render: (row) => `${row.purchase_status} / ${row.payment_status}` },
              ]}
            />
          </Panel>
        </div>
      )}

      {section === "Tax Obligations" && (
        <div className="space-y-5">
          <Panel
            title="Add Tax Rule"
            description="Enter rates only after checking the current rule with TRA or a qualified tax adviser. Percentage rates are entered as percentages, e.g. 30 means 30%."
          >
            <form onSubmit={saveTaxRule} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Rule Name *" value={taxRule.rule_name} onChange={(v) => setTaxRule((p) => ({ ...p, rule_name: v }))} />
                <Field label="Tax Type *" value={taxRule.tax_type} onChange={(v) => setTaxRule((p) => ({ ...p, tax_type: v }))} />
                <SelectField
                  label="Calculation Method"
                  value={taxRule.calculation_method}
                  onChange={(v) => setTaxRule((p) => ({ ...p, calculation_method: v }))}
                  options={[
                    { value: "manual", label: "Manual / no automatic estimate" },
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed_amount", label: "Fixed amount" },
                  ]}
                />
                <Field label={taxRule.calculation_method === "percentage" ? "Rate (%) *" : "Rate / Amount"} type="number" value={taxRule.rate} onChange={(v) => setTaxRule((p) => ({ ...p, rate: v }))} />
                <Field label="Source / Authority * if verified" value={taxRule.source_name} onChange={(v) => setTaxRule((p) => ({ ...p, source_name: v }))} placeholder="TRA, tax adviser, official notice..." />
                <Field label="Source URL (optional)" value={taxRule.source_url} onChange={(v) => setTaxRule((p) => ({ ...p, source_url: v }))} />
                <Field label="Effective From" type="date" value={taxRule.effective_from} onChange={(v) => setTaxRule((p) => ({ ...p, effective_from: v }))} />
                <Field label="Effective To" type="date" value={taxRule.effective_to} onChange={(v) => setTaxRule((p) => ({ ...p, effective_to: v }))} />
                <Field label="Notes" value={taxRule.notes} onChange={(v) => setTaxRule((p) => ({ ...p, notes: v }))} />
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={taxRule.verified}
                  onChange={(e) => setTaxRule((p) => ({ ...p, verified: e.target.checked, verification_confirmed: e.target.checked ? p.verification_confirmed : false }))}
                  className="mt-1 h-4 w-4 accent-emerald-700"
                />
                <span>Mark this rule as verified. Only tick this after checking the rate and source with TRA or a qualified tax adviser.</span>
              </label>
              {taxRule.verified && (
                <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <input type="checkbox" required checked={taxRule.verification_confirmed} onChange={(e) => setTaxRule((p) => ({ ...p, verification_confirmed: e.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-700" />
                  <span>I confirm this rule and its source have been checked with TRA or a qualified tax adviser.</span>
                </label>
              )}
              <button disabled={saving} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                {saving ? "Saving..." : "Save Tax Rule"}
              </button>
            </form>
          </Panel>

          <Panel
            title="Add Tax Obligation"
            description="Keep the status unverified until you confirm whether this obligation applies to Gamora Online."
          >
            <form onSubmit={saveObligation} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Obligation Name *" value={obligation.obligation_name} onChange={(v) => setObligation((p) => ({ ...p, obligation_name: v }))} />
                <Field label="Tax Type *" value={obligation.tax_type} onChange={(v) => setObligation((p) => ({ ...p, tax_type: v }))} />
                <SelectField
                  label="Linked Tax Rule"
                  value={obligation.tax_rule_id}
                  onChange={(v) => setObligation((p) => ({ ...p, tax_rule_id: v }))}
                  options={[
                    { value: "", label: "No rule linked" },
                    ...data.rules.map((r) => ({ value: String(r.id), label: `${r.rule_name} (${r.tax_type})` })),
                  ]}
                />
                <SelectField
                  label="Applicability Status"
                  value={obligation.status}
                  onChange={(v) => setObligation((p) => ({ ...p, status: v, verification_confirmed: v === "applicable" || v === "not_applicable" ? p.verification_confirmed : false }))}
                  options={[
                    { value: "unverified", label: "Unverified" },
                    { value: "under_review", label: "Under review" },
                    { value: "applicable", label: "Applicable — verified" },
                    { value: "not_applicable", label: "Not applicable — verified" },
                  ]}
                />
                <SelectField
                  label="Filing Period"
                  value={obligation.period_type}
                  onChange={(v) => setObligation((p) => ({ ...p, period_type: v }))}
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "quarterly", label: "Quarterly" },
                    { value: "annual", label: "Annual" },
                    { value: "one_off", label: "One-off" },
                    { value: "as_required", label: "As required" },
                  ]}
                />
                <Field label="Effective From" type="date" value={obligation.effective_from} onChange={(v) => setObligation((p) => ({ ...p, effective_from: v }))} />
                <Field label="Effective To" type="date" value={obligation.effective_to} onChange={(v) => setObligation((p) => ({ ...p, effective_to: v }))} />
                <Field label="Notes" value={obligation.notes} onChange={(v) => setObligation((p) => ({ ...p, notes: v }))} />
              </div>
              {(obligation.status === "applicable" || obligation.status === "not_applicable") && (
                <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <input type="checkbox" required checked={obligation.verification_confirmed} onChange={(e) => setObligation((p) => ({ ...p, verification_confirmed: e.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-700" />
                  <span>I confirm the applicability status was checked with TRA or a qualified tax adviser.</span>
                </label>
              )}
              <button disabled={saving} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                {saving ? "Saving..." : "Save Tax Obligation"}
              </button>
            </form>
          </Panel>

          <Panel title="Tax Obligations" description="Applicability must be verified before treating an obligation as confirmed.">
            <DataTable
              rows={data.obligations}
              empty="No tax obligations recorded. Do not assume a tax applies until verified."
              columns={[
                { label: "Obligation", render: (row) => row.obligation_name },
                { label: "Type", render: (row) => row.tax_type },
                { label: "Status", render: (row) => row.status },
                { label: "Period", render: (row) => row.period_type || "Not set" },
                { label: "Notes", render: (row) => row.notes || "—" },
              ]}
            />
          </Panel>
          <Panel title="Tax Rules" description="Only verified rules should be used for tax calculations.">
            <DataTable
              rows={data.rules}
              empty="No tax rules recorded."
              columns={[
                { label: "Rule", render: (row) => row.rule_name },
                { label: "Tax Type", render: (row) => row.tax_type },
                { label: "Rate", render: (row) => row.rate == null ? "Manual / not set" : `${row.rate}%` },
                { label: "Verified", render: (row) => row.verified ? "Yes" : "Not verified" },
                { label: "Source", render: (row) => row.source_name || "Not recorded" },
              ]}
            />
          </Panel>
        </div>
      )}

      {section === "Returns & Payments" && (
        <div className="space-y-5">
          <Panel title="Tax Returns" description="This area currently displays saved records; filing is not performed automatically.">
            <DataTable
              rows={data.returns}
              empty="No tax returns recorded."
              columns={[
                { label: "Obligation ID", render: (row) => row.obligation_id },
                { label: "Period", render: (row) => `${row.period_start} to ${row.period_end}` },
                { label: "Due Date", render: (row) => row.due_date || "—" },
                { label: "Estimated Tax", render: (row) => row.estimated_tax == null ? "Not estimated" : money(row.estimated_tax) },
                { label: "Status", render: (row) => row.status },
              ]}
            />
          </Panel>
          <Panel title="Tax Payments" description="These are separate from customer order payments.">
            <DataTable
              rows={data.payments}
              empty="No tax payments recorded."
              columns={[
                { label: "Date", render: (row) => row.payment_date },
                { label: "Amount", render: (row) => money(row.amount) },
                { label: "Method", render: (row) => row.payment_method || "—" },
                { label: "Reference", render: (row) => row.payment_reference || "—" },
                { label: "Verification", render: (row) => row.verification_status },
              ]}
            />
          </Panel>
        </div>
      )}

      {section === "Deadlines & Adjustments" && (
        <div className="space-y-5">
          <Panel title="Tax Deadlines" description="Only verified deadlines should be treated as confirmed filing dates.">
            <DataTable
              rows={data.deadlines}
              empty="No tax deadlines recorded."
              columns={[
                { label: "Title", render: (row) => row.title },
                { label: "Due Date", render: (row) => row.due_date },
                { label: "Status", render: (row) => row.status },
                { label: "Verified", render: (row) => row.verified ? "Yes" : "Not verified" },
                { label: "Notes", render: (row) => row.notes || "—" },
              ]}
            />
          </Panel>
          <Panel title="Tax Adjustments" description="Adjustments are displayed for review; they are not silently applied to tax totals.">
            <DataTable
              rows={data.adjustments}
              empty="No tax adjustments recorded."
              columns={[
                { label: "Return ID", render: (row) => row.tax_return_id ?? "—" },
                { label: "Type", render: (row) => row.adjustment_type },
                { label: "Amount", render: (row) => money(row.amount) },
                { label: "Reason", render: (row) => row.reason },
                { label: "Status", render: (row) => row.status },
              ]}
            />
          </Panel>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Record-keeping tool only. Tax applicability, rates, filing requirements and deadlines must be verified with TRA or a qualified tax adviser. This module does not file returns or pay tax automatically.
      </p>
    </div>
  );
}
