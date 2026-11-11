import cashIcon from '../assets/misc/cash.png'
import { perHour } from '../utils/income.js'
import AbbreviatedNumber from './AbbreviatedNumber.jsx'

// One line of the income breakdown on the city and development cards: a grey label, then the amount per hour with an
// optional badge after it. The label never wraps; a long value wraps below it instead of squeezing the label.
// `amount` is per day, as the economy works it out; the row shows it per hour.
function IncomeRow({ label, amount, children, last = false }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: last ? 'none' : '1px solid #eee' }}>
            <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '2px 4px', fontWeight: 'bold', fontSize: '0.92rem', textAlign: 'right' }}>
                <AbbreviatedNumber value={perHour(amount)} icon={cashIcon} iconAlt="£" suffix="/hr" />
                {children}
            </span>
        </div>
    )
}

export default IncomeRow
