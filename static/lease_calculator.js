// Lease Calculator and Financial Functions

class LeaseCalculator {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Auto-calculate monthly payment when lease terms change
        const leaseInputs = ['lease_price', 'lease_term', 'payment_frequency'];
        leaseInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.calculateMonthlyPayment());
        });

        // Auto-calculate lease end date when start date and term change
        document.getElementById('lease_start_date')?.addEventListener('change', () => this.calculateLeaseEndDate());
        document.getElementById('lease_term')?.addEventListener('change', () => this.calculateLeaseEndDate());

        // Update payment schedule when relevant fields change
        const scheduleFields = ['lease_start_date', 'lease_term', 'monthly_payment', 'payment_frequency'];
        scheduleFields.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.updatePaymentSchedule());
        });
    }

    calculateMonthlyPayment() {
        const leasePrice = parseFloat(document.getElementById('lease_price').value) || 0;
        const leaseTerm = parseInt(document.getElementById('lease_term').value) || 0;
        const paymentFrequency = document.getElementById('payment_frequency').value;
        
        if (leasePrice && leaseTerm) {
            let periodicPayment;
            switch(paymentFrequency) {
                case 'monthly':
                    periodicPayment = leasePrice / leaseTerm;
                    break;
                case 'quarterly':
                    periodicPayment = (leasePrice / leaseTerm) * 3;
                    break;
                case 'annually':
                    periodicPayment = (leasePrice / leaseTerm) * 12;
                    break;
                default:
                    periodicPayment = leasePrice / leaseTerm;
            }
            
            // Round to 2 decimal places
            periodicPayment = Math.round(periodicPayment * 100) / 100;
            
            // Update monthly payment field
            document.getElementById('monthly_payment').value = periodicPayment;
            
            // Update payment schedule
            this.updatePaymentSchedule();
        }
    }

    calculateLeaseEndDate() {
        const startDate = document.getElementById('lease_start_date').value;
        const leaseTerm = parseInt(document.getElementById('lease_term').value) || 0;
        
        if (startDate && leaseTerm) {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + leaseTerm);
            
            // Update lease end date field
            document.getElementById('lease_end_date').value = endDate.toISOString().split('T')[0];
        }
    }

    updatePaymentSchedule() {
        const startDate = document.getElementById('lease_start_date').value;
        const leaseTerm = parseInt(document.getElementById('lease_term').value) || 0;
        const monthlyPayment = parseFloat(document.getElementById('monthly_payment').value) || 0;
        const paymentFrequency = document.getElementById('payment_frequency').value;
        
        if (startDate && leaseTerm && monthlyPayment) {
            const schedule = this.generatePaymentSchedule(
                new Date(startDate),
                leaseTerm,
                monthlyPayment,
                paymentFrequency
            );
            
            this.displayPaymentSchedule(schedule);
        }
    }

    generatePaymentSchedule(startDate, leaseTerm, payment, frequency) {
        const schedule = [];
        let currentDate = new Date(startDate);
        let remainingTerm = leaseTerm;
        
        while (remainingTerm > 0) {
            let paymentDate = new Date(currentDate);
            let amount = payment;
            
            schedule.push({
                date: paymentDate.toISOString().split('T')[0],
                amount: amount,
                remaining: remainingTerm
            });
            
            // Advance to next payment date
            switch(frequency) {
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    remainingTerm--;
                    break;
                case 'quarterly':
                    currentDate.setMonth(currentDate.getMonth() + 3);
                    remainingTerm -= 3;
                    break;
                case 'annually':
                    currentDate.setMonth(currentDate.getMonth() + 12);
                    remainingTerm -= 12;
                    break;
            }
        }
        
        return schedule;
    }

    displayPaymentSchedule(schedule) {
        const container = document.getElementById('paymentSchedule');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create schedule table
        const table = document.createElement('table');
        table.className = 'table table-sm table-striped';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Payment Date</th>
                    <th>Amount</th>
                    <th>Remaining Term</th>
                </tr>
            </thead>
            <tbody>
                ${schedule.map(payment => `
                    <tr>
                        <td>${payment.date}</td>
                        <td>$${payment.amount.toFixed(2)}</td>
                        <td>${payment.remaining} months</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.appendChild(table);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    calculateTotalLeaseValue() {
        const monthlyPayment = parseFloat(document.getElementById('monthly_payment').value) || 0;
        const leaseTerm = parseInt(document.getElementById('lease_term').value) || 0;
        const installationFee = parseFloat(document.getElementById('installation_fee').value) || 0;
        
        return (monthlyPayment * leaseTerm) + installationFee;
    }

    validateLeaseTerms() {
        const required = [
            'lease_price',
            'lease_term',
            'monthly_payment',
            'lease_start_date',
            'payment_frequency'
        ];
        
        const missing = required.filter(id => {
            const element = document.getElementById(id);
            return !element || !element.value;
        });
        
        if (missing.length > 0) {
            throw new Error(`Missing required lease terms: ${missing.join(', ')}`);
        }
        
        return true;
    }
}

// Initialize lease calculator
document.addEventListener('DOMContentLoaded', () => {
    window.leaseCalculator = new LeaseCalculator();
});