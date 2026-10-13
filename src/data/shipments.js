const couriers = ['PostEx','TCS','Leopards','M&P','Trax']
const cities = [
  ['Lahore','Punjab','54000'],['Islamabad','Islamabad Capital Territory','44000'],['Karachi','Sindh','75500'],
  ['Faisalabad','Punjab','38000'],['Multan','Punjab','60000'],['Rawalpindi','Punjab','46000'],['Gujranwala','Punjab','52250'],
  ['Sialkot','Punjab','51310'],['Peshawar','Khyber Pakhtunkhwa','25000'],['Bahawalpur','Punjab','63100'],['Hyderabad','Sindh','71000']
]
export const shipmentStatuses = ['Pickup Pending','In Transit','Out for Delivery','Delivered','Undelivered','RTO In Transit','RTO Delivered','Lost/Damaged']
const sequence = ['In Transit','Delivered','Pickup Pending','Out for Delivery','Undelivered','RTO In Transit','RTO Delivered','Lost/Damaged','In Transit','Out for Delivery','Delivered','Pickup Pending']
const scansFor = (status, origin, destination, date, index) => {
  const t = new Date(date).getTime()
  const events = [
    { status:'Shipment created', location:origin, detail:'Shipment information received from shipper', offset:0, complete:true },
    { status:'Pickup scheduled', location:origin, detail:'Pickup request registered with courier partner', offset:25, complete:status!=='Pickup Pending' },
    { status:'Picked up', location:origin+' Hub', detail:'Shipment collected from shipper', offset:100, complete:!['Pickup Pending'].includes(status) },
    { status:'Arrived at origin facility', location:origin+' Sorting Centre', detail:'Shipment scanned at origin facility', offset:260, complete:!['Pickup Pending'].includes(status) },
    { status:'In transit to destination', location:'Linehaul Hub', detail:'Shipment moving through courier network', offset:650, complete:['In Transit','Out for Delivery','Delivered','Undelivered','RTO In Transit','RTO Delivered','Lost/Damaged'].includes(status) },
    { status:'Arrived at destination facility', location:destination+' Hub', detail:'Shipment reached destination delivery facility', offset:1000, complete:['Out for Delivery','Delivered','Undelivered','RTO In Transit','RTO Delivered','Lost/Damaged'].includes(status) },
    { status:'Out for delivery', location:destination+' Delivery Hub', detail:'Shipment assigned to delivery associate', offset:1250, complete:['Out for Delivery','Delivered','Undelivered'].includes(status) },
    { status:'Delivered', location:destination, detail:'Shipment delivered to recipient', offset:1500, complete:status==='Delivered' },
  ]
  if(status==='Pickup Pending') return events.slice(0,2).map((e,i)=>({...e,time:new Date(t+e.offset*60000).toISOString(),complete:i===0}))
  let included=events.filter(e=>e.complete || e.status==='Shipment created')
  if(status==='Undelivered') included=included.filter(e=>e.status!=='Delivered').concat([{status:'Delivery attempted',location:destination,detail:'Delivery attempt unsuccessful; action may be required',offset:1500,complete:true}])
  if(status==='RTO In Transit'||status==='RTO Delivered') included=included.filter(e=>e.status!=='Delivered').concat([
    {status:'Return to origin initiated',location:destination,detail:'Shipment marked for return to shipper',offset:1500,complete:true},
    {status:'Return in transit',location:'Linehaul Hub',detail:'Shipment returning to origin',offset:1800,complete:true},
    ...(status==='RTO Delivered'?[{status:'Returned to shipper',location:origin,detail:'Shipment returned to origin',offset:2300,complete:true}]:[])
  ])
  if(status==='Lost/Damaged') included=included.filter(e=>e.status!=='Delivered').concat([{status:index%2?'Shipment delayed':'Damage reported',location:'Regional Sorting Centre',detail:index%2?'Shipment could not be located during scheduled scan':'Courier partner reported a package damage exception',offset:1600,complete:true}])
  return included.map(e=>({...e,time:new Date(t+e.offset*60000).toISOString()}))
}
export const mockShipments = Array.from({length:72},(_,i)=>{
  const n=i+1, origin=cities[(n*3)%cities.length], dest=cities[(n*7+4)%cities.length], status=sequence[(n*5+Math.floor(n/3))%sequence.length]
  const date=new Date(2026,9,13-Math.floor(i/4),8+(n%10),(n*11)%60)
  const orderId='IK-'+String(248700+n).padStart(6,'0')
  const courier=couriers[(n+Math.floor(n/5))%couriers.length]
  const awb=['PX','TCS','LEO','MP','TRX'][n%5]+String(72000000+n*31)
  const scans=scansFor(status,origin[0],dest[0],date.toISOString(),n)
  const last=scans.filter(e=>e.complete).slice(-1)[0]||scans[0]
  const eta=new Date(date.getTime()+(status==='Delivered'?24:status==='Pickup Pending'?12:36+(n%36))*3600000)
  return {awb,orderId,courier,origin:origin[0],originState:origin[1],originPincode:origin[2],destination:dest[0],destinationState:dest[1],destinationPincode:dest[2],eta:eta.toISOString(),status,lastScanStatus:last.status,lastScanLocation:last.location,lastScanAt:last.time,updatedAt:last.time,weight:+(0.4+(n%7)*0.25).toFixed(2),paymentMode:n%3?'COD':'Prepaid',amount:950+((n*379)%6900),customer:['Ayesha Khan','Hamza Raza','Sara Malik','Usman Ali','Maham Noor','Bilal Ahmed'][n%6],phone:'+92 300 '+String(1000000+n*731).slice(0,7),scans:scans.sort((a,b)=>new Date(b.time)-new Date(a.time))}
})
export const shipmentStatusTabs = [{label:'All',key:'All'},...shipmentStatuses.map(label=>({label,key:label}))]
export const shipmentCouriers = couriers
