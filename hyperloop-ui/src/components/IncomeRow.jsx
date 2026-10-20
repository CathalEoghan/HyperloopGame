import cashIcon from '../assets/misc/cash.png'
import { formatPerHour } from '../utils/income.js'

// One line of the income breakdown on the city and development cards: a grey label, then the amount per hour with an
// optional badge after it. The label never wraps; a long value wraps below it instead of squeezing the label.
// `amount` is per day, as the economy works it out; the row shows it per hour.
function IncomeRow({ label, amount, children, last = false }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #eee' }}>
            <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '2px 4px', fontWeight: 'bold', fontSize: '0.92rem', textAlign: 'right' }}>
                <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                <span style={{ whiteSpace: 'nowrap' }}>{formatPerHour(amount)}/hr</span>
                {children}
            </span>
        </div>
    )
}

export default IncomeRow
