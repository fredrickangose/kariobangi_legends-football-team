import {
  ORDER_FULFILLMENT_STEPS,
  getFulfillmentStepIndex,
  getOrderStatusLabel,
  type OrderFulfillmentStatus,
} from "@/lib/order-tracking";

interface OrderProgressTimelineProps {
  orderStatus?: string;
  paymentStatus?: string;
  mpesaReceiptNumber?: string | null;
  items?: Array<{
    id: number;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount?: number;
  createdAt?: Date | string;
  compact?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  onStatusChange?: (status: OrderFulfillmentStatus) => void;
}

export function OrderProgressTimeline({
  orderStatus = "processing",
  paymentStatus,
  mpesaReceiptNumber,
  items = [],
  totalAmount,
  createdAt,
  compact = false,
  interactive = false,
  disabled = false,
  onStatusChange,
}: OrderProgressTimelineProps) {
  const paymentConfirmed =
    String(paymentStatus || "").toLowerCase() === "paid";

  if (orderStatus === "cancelled" && !interactive) {
    return (
      <p className="text-sm text-rose-700 font-semibold">
        This order was cancelled. Contact the club if you need help.
      </p>
    );
  }

  const currentIndex = getFulfillmentStepIndex(orderStatus);

  const handleStepClick = (stepKey: OrderFulfillmentStatus) => {
    if (!interactive || disabled || !onStatusChange) {
      return;
    }

    if (stepKey !== "cancelled" && !paymentConfirmed) {
      return;
    }

    onStatusChange(stepKey);
  };

  return (
    <div className="space-y-4">
      <div
        className={`grid grid-cols-1 ${compact ? "md:grid-cols-3" : "md:grid-cols-3"} gap-4`}
      >
        {ORDER_FULFILLMENT_STEPS.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const stepDisabled =
            disabled || (interactive && !paymentConfirmed);
          const stepClasses = `rounded-2xl p-4 border text-left w-full ${
            isCurrent
              ? "border-emerald-300 bg-white shadow-sm"
              : isComplete
                ? "border-emerald-100 bg-white"
                : "border-slate-200 bg-white/70"
          } ${
            interactive && !stepDisabled
              ? "cursor-pointer hover:border-emerald-300 hover:shadow-sm transition"
              : interactive && stepDisabled
                ? "cursor-not-allowed opacity-60"
                : ""
          }`;

          const content = (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isComplete
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                <p className="font-black text-sm text-slate-950">{step.label}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </>
          );

          if (interactive) {
            return (
              <button
                key={step.key}
                type="button"
                disabled={stepDisabled}
                onClick={() => handleStepClick(step.key)}
                className={stepClasses}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={step.key} className={stepClasses}>
              {content}
            </div>
          );
        })}
      </div>

      {interactive && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleStepClick("cancelled")}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition ${
              orderStatus === "cancelled"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Mark Cancelled
          </button>
          {!paymentConfirmed && (
            <p className="text-[10px] text-slate-500">
              Fulfillment steps unlock after payment is confirmed. You can still
              cancel unpaid orders.
            </p>
          )}
        </div>
      )}

      {orderStatus === "cancelled" && interactive && (
        <p className="text-sm text-rose-700 font-semibold">
          This order is marked cancelled.
        </p>
      )}

      {!compact && items.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Items in this order
          </p>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-3 text-xs text-slate-700"
            >
              <span>
                {item.productName} • Size {item.size} • Qty {item.quantity}
              </span>
              <span className="font-bold">
                Ksh {(item.unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          {totalAmount != null && (
            <p className="pt-2 border-t border-slate-100 text-sm font-black text-slate-950">
              Total: Ksh {totalAmount.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500">
        Payment:{" "}
        <strong className="text-slate-800 uppercase">
          {paymentStatus || "pending"}
        </strong>
        {mpesaReceiptNumber && (
          <>
            {" "}
            • Receipt:{" "}
            <strong className="text-slate-800">{mpesaReceiptNumber}</strong>
          </>
        )}
        {createdAt && (
          <>
            {" "}
            • Placed:{" "}
            <strong className="text-slate-800">
              {new Date(createdAt).toLocaleString()}
            </strong>
          </>
        )}
      </div>
    </div>
  );
}

export function OrderStatusBadge({ orderStatus }: { orderStatus?: string }) {
  return (
    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
      {getOrderStatusLabel(orderStatus || "processing")}
    </span>
  );
}
