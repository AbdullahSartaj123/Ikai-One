export default function StatusBadge({status}) {
 const tone = status==='Delivered'?'success':status==='In transit'||status==='Out for delivery'?'info':status==='NDR raised'?'danger':'warning'
 return <span className={'status-badge status-'+tone}><i/>{status}</span>
}