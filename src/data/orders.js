const customers = [
  ['Ayesha Khan','Lahore','Punjab','54000'],['Hamza Raza','Islamabad','Islamabad Capital Territory','44000'],['Sara Malik','Karachi','Sindh','75500'],
  ['Usman Ali','Faisalabad','Punjab','38000'],['Maham Noor','Multan','Punjab','60000'],['Bilal Ahmed','Rawalpindi','Punjab','46000'],
  ['Hira Shah','Gujranwala','Punjab','52250'],['Daniyal Khan','Sialkot','Punjab','51310'],['Noor Fatima','Peshawar','Khyber Pakhtunkhwa','25000'],
  ['Zain Malik','Bahawalpur','Punjab','63100'],['Iqra Javed','Sargodha','Punjab','40100'],['Talha Siddiqui','Hyderabad','Sindh','71000'],
  ['Muneeb Aslam','Quetta','Balochistan','87300'],['Maryam Iqbal','Abbottabad','Khyber Pakhtunkhwa','22010'],['Saad Hussain','Sheikhupura','Punjab','39350']
]
const products = [
  ['IK-TS-001','IKAI Essential Tee'],['SKN-014','Hydrating Skin Serum'],['HME-221','Minimal Desk Lamp'],['FAS-088','Everyday Canvas Bag'],
  ['ELC-032','Wireless Earbuds'],['HME-119','Cotton Bedsheet Set'],['BTY-054','Vitamin C Face Wash'],['SPT-207','Training Water Bottle'],
  ['ACC-402','Classic Wrist Watch'],['FAS-102','Linen Casual Shirt'],['ELC-118','USB-C Fast Charger'],['HME-309','Ceramic Coffee Set']
]
const channels = ['Shopify','WooCommerce','Daraz','Manual','Instagram']
const couriers = ['PostEx','TCS','Leopards','M&P','Trax']
const statuses = ['New','Ready to Ship','Pickup Scheduled','In Transit','Delivered','RTO','Cancelled']
const statusSequence = ['New','Ready to Ship','Pickup Scheduled','In Transit','Delivered','RTO','Cancelled','Delivered','In Transit','Ready to Ship']
export const orderStatuses = ['All','New','Ready to Ship','Pickup Scheduled','In Transit','Delivered','RTO','Cancelled']
export const mockOrders = Array.from({ length: 72 }, (_, index) => {
  const n = index + 1
  const customer = customers[(n * 7 + Math.floor(n / 3)) % customers.length]
  const product = products[(n * 5 + 2) % products.length]
  const status = statusSequence[(n * 3 + Math.floor(n / 4)) % statusSequence.length]
  const date = new Date(2026, 9, 13 - Math.floor(index / 4), 9 + ((index * 3) % 9), (index * 13) % 60)
  const quantity = 1 + (index % 3)
  const price = 950 + ((n * 379) % 6900)
  return {
    id: 'IK-' + String(248700 + n).padStart(6, '0'),
    channel: channels[(n + Math.floor(n / 4)) % channels.length],
    customer: customer[0],
    phone: '+92 3' + String(100000000 + n * 731).slice(0, 9),
    email: customer[0].toLowerCase().replace(' ', '.') + '@example.com',
    city: customer[1], state: customer[2], pincode: customer[3],
    address: (12 + n) + ', ' + ['Main Boulevard','Model Town Link Road','Gulberg Main Market','Canal View Road','University Road'][n % 5],
    product: product[1], sku: product[0], quantity, unitPrice: price, amount: price * quantity,
    paymentMode: n % 3 === 0 ? 'Prepaid' : 'COD', weight: +(0.35 + (n % 8) * 0.2).toFixed(2),
    date: date.toISOString(), status, courier: couriers[(n + Math.floor(n / 5)) % couriers.length],
    trackingId: ['PX','TCS','LEO','MP','TRX'][n % 5] + String(72000000 + n * 31),
    timeline: [
      { title: 'Order placed', detail: 'Order received in IKAI One', date: date.toISOString(), complete: true },
      { title: 'Order confirmed', detail: 'Customer and delivery details saved', date: new Date(date.getTime()+7*60000).toISOString(), complete: status !== 'New' && status !== 'Cancelled' },
      { title: 'Shipment booked', detail: 'Courier booking reference: ' + (72000000 + n * 31), date: new Date(date.getTime()+27*60000).toISOString(), complete: ['Pickup Scheduled','In Transit','Delivered','RTO'].includes(status) },
      { title: status === 'RTO' ? 'Return initiated' : status === 'Delivered' ? 'Delivered to customer' : 'In courier network', detail: 'Latest status supplied by mock shipment data', date: new Date(date.getTime()+4*3600000).toISOString(), complete: ['In Transit','Delivered','RTO'].includes(status) }
    ]
  }
})
export const paymentModes = ['Prepaid','COD']
export const orderCouriers = couriers
export const orderChannels = channels
