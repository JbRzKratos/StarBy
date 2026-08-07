import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function getStatusIndex(status: string) {
  const s = status.toLowerCase();
  if (['pending_payment'].includes(s)) return 0;
  if (['placed', 'processing'].includes(s)) return 1;
  if (['shipped', 'out_for_delivery'].includes(s)) return 2;
  if (['delivered', 'completed'].includes(s)) return 3;
  return -1;
}

export default async function OrderTrackingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } }
  });

  if (!order || order.userId !== user.id) {
    redirect('/account/orders');
  }

  const currentIndex = getStatusIndex(order.status);
  const isCancelled = order.status.toLowerCase() === 'cancelled' || order.status.toLowerCase() === 'failed';

  const steps = [
    { label: 'Order Placed', index: 1 },
    { label: 'Processing', index: 1 }, // Map placed/processing to step 2 visually
    { label: 'Shipped', index: 2 },
    { label: 'Delivered', index: 3 },
  ];

  // We'll simplify to 4 main visual steps
  const visualSteps = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href={`/account/orders/${order.id}`} className="text-cobalt hover:underline text-sm font-medium">
          &larr; Back to Order Details
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10">
        <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
          Track Order: {order.id}
        </h1>
        <p className="text-gray-500 mb-10">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-red-700 font-bold text-lg mb-2">Order Cancelled</h3>
            <p className="text-red-600 text-sm">This order was cancelled and will not be delivered.</p>
          </div>
        ) : (
          <div className="relative pt-8 pb-12">
            <div className="absolute left-0 sm:left-1/2 sm:-ml-0.5 top-0 bottom-0 w-1 bg-gray-100 sm:w-1"></div>
            
            <div className="space-y-12 relative z-10 sm:space-y-0 sm:flex sm:justify-between sm:items-start">
              {visualSteps.map((step, idx) => {
                const isActive = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                
                return (
                  <div key={step} className="relative flex items-center sm:flex-col sm:items-center sm:w-1/4">
                    <div className="sm:hidden absolute left-2 top-0 bottom-[-3rem] w-0.5 bg-gray-100 -z-10"></div>
                    
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full z-10 shrink-0
                      ${isActive ? 'bg-cobalt text-white shadow-md shadow-cobalt/20' : 'bg-gray-200 text-gray-400'}
                    `}>
                      {isActive ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                    
                    <div className="ml-4 sm:ml-0 sm:mt-4 sm:text-center">
                      <h4 className={`text-sm font-bold ${isActive ? 'text-charcoal' : 'text-gray-400'}`}>
                        {step}
                      </h4>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-1">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Horizontal Line for Desktop */}
            <div className="hidden sm:block absolute top-12 left-8 right-8 h-1 bg-gray-100 -z-10"></div>
            <div 
              className="hidden sm:block absolute top-12 left-8 h-1 bg-cobalt -z-10 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, (currentIndex / 3) * 100))}%` }}
            ></div>
          </div>
        )}

        {/* Tracking Information Box */}
        {(order.carrier || order.trackingNumber) && (
          <div className="mt-12 bg-gray-50 border border-gray-100 rounded-xl p-6">
            <h3 className="font-display text-lg font-bold text-charcoal mb-4">Tracking Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Carrier</p>
                <p className="text-sm font-medium text-charcoal">{order.carrier || 'Standard Shipping'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
                <p className="text-sm font-medium text-charcoal">{order.trackingNumber || 'N/A'}</p>
              </div>
            </div>
            
            {order.trackingUrl && (
              <div className="mt-6">
                <a 
                  href={order.trackingUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-charcoal text-white text-sm font-medium rounded-lg hover:bg-charcoal/90 transition-colors"
                >
                  Track on {order.carrier || 'Courier'} Website
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
