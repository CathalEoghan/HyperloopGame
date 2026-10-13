import cashIcon from '../assets/misc/cash.png'

// One line of the income breakdown on the city and development cards: a grey label, then the amount per day with an
// optional badge after it. The label never wraps; a long value wraps below it instead of squeezing the label.
function IncomeRow({ label, amount, children, last = false }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #eee' }}>
            <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '2px 4px', fontWeight: 'bold', fontSize: '0.92rem', textAlign: 'right' }}>
                <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                <span style={{ whiteSpace: 'nowrap' }}>{Math.floor(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day</span>
                {children}
            </span>
        </div>
    )
}

export default IncomeRow
