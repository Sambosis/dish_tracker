from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dishes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'dev-key-change-in-production'

db = SQLAlchemy(app)

# Data Models
class DishSale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    priority = db.Column(db.Integer, default=3)  # 1=High, 2=Medium, 3=Low
    salesperson = db.Column(db.String(100), nullable=False)
    customer = db.Column(db.String(100), nullable=False)
    machine_model = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    owner = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    
    # Important Dates
    verbal_date = db.Column(db.DateTime)
    paperwork_date = db.Column(db.DateTime)
    payment_date = db.Column(db.DateTime)
    installation_date = db.Column(db.DateTime)
    
    # Lease Information
    lease_price = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sales', methods=['GET'])
def get_sales():
    sales = DishSale.query.all()
    return jsonify([{
        'id': sale.id,
        'priority': sale.priority,
        'salesperson': sale.salesperson,
        'customer': sale.customer,
        'machine_model': sale.machine_model,
        'address': sale.address,
        'owner': sale.owner,
        'phone': sale.phone,
        'verbal_date': sale.verbal_date.isoformat() if sale.verbal_date else None,
        'paperwork_date': sale.paperwork_date.isoformat() if sale.paperwork_date else None,
        'payment_date': sale.payment_date.isoformat() if sale.payment_date else None,
        'installation_date': sale.installation_date.isoformat() if sale.installation_date else None,
        'lease_price': sale.lease_price,
        'id': sale.id
    } for sale in sales])

@app.route('/api/sales', methods=['POST'])
def create_sale():
    data = request.json
    
    sale = DishSale(
        priority=data.get('priority', 3),
        salesperson=data['salesperson'],
        customer=data['customer'],
        machine_model=data['machine_model'],
        address=data.get('address'),
        owner=data.get('owner'),
        phone=data.get('phone'),
        verbal_date=datetime.fromisoformat(data['verbal_date']) if data.get('verbal_date') else None,
        paperwork_date=datetime.fromisoformat(data['paperwork_date']) if data.get('paperwork_date') else None,
        payment_date=datetime.fromisoformat(data['payment_date']) if data.get('payment_date') else None,
        installation_date=datetime.fromisoformat(data['installation_date']) if data.get('installation_date') else None,
        lease_price=data.get('lease_price')
    )
    
    db.session.add(sale)
    db.session.commit()
    
    return jsonify({'id': sale.id, 'message': 'Sale created successfully'}), 201

@app.route('/api/sales/<int:sale_id>', methods=['PUT'])
def update_sale(sale_id):
    sale = DishSale.query.get_or_404(sale_id)
    data = request.json
    
    sale.priority = data.get('priority', sale.priority)
    sale.salesperson = data.get('salesperson', sale.salesperson)
    sale.customer = data.get('customer', sale.customer)
    sale.machine_model = data.get('machine_model', sale.machine_model)
    sale.address = data.get('address', sale.address)
    sale.owner = data.get('owner', sale.owner)
    sale.phone = data.get('phone', sale.phone)
    
    # Update dates if provided
    if 'verbal_date' in data:
        sale.verbal_date = datetime.fromisoformat(data['verbal_date']) if data['verbal_date'] else None
    if 'paperwork_date' in data:
        sale.paperwork_date = datetime.fromisoformat(data['paperwork_date']) if data['paperwork_date'] else None
    if 'payment_date' in data:
        sale.payment_date = datetime.fromisoformat(data['payment_date']) if data['payment_date'] else None
    if 'installation_date' in data:
        sale.installation_date = datetime.fromisoformat(data['installation_date']) if data['installation_date'] else None
    
    sale.lease_price = data.get('lease_price', sale.lease_price)
    
    db.session.commit()
    return jsonify({'message': 'Sale updated successfully'})

@app.route('/api/sales/<int:sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    sale = DishSale.query.get_or_404(sale_id)
    db.session.delete(sale)
    db.session.commit()
    return jsonify({'message': 'Sale deleted successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)