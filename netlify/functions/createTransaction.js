const midtransClient = require("midtrans-client")

exports.handler = async (event) => {

const snap = new midtransClient.Snap({
isProduction:false,
serverKey:process.env.MIDTRANS_SERVER_KEY
})

const body = JSON.parse(event.body)

// item dari cart
let items = body.items.map(i => ({
id:String(i.id),
price:Number(i.price),
quantity:Number(i.qty),
name:i.name
}))

// hitung subtotal
let subtotal = 0
items.forEach(i=>{
subtotal += i.price * i.quantity
})

// service 5%
const service = Math.round(subtotal * 0.05)

// tax 10%
const tax = Math.round(subtotal * 0.10)

// tambahkan ke item list
items.push({
id:"service",
price:service,
quantity:1,
name:"Service Charge"
})

items.push({
id:"tax",
price:tax,
quantity:1,
name:"Tax"
})

// hitung ulang total dari SEMUA item
let gross = 0
items.forEach(i=>{
gross += i.price * i.quantity
})

const parameter = {
transaction_details:{
order_id:"ORDER-"+Date.now(),
gross_amount:gross
},
item_details:items
}

try{

const transaction = await snap.createTransaction(parameter)

return{
statusCode:200,
body:JSON.stringify({
token:transaction.token
})
}

}catch(err){

console.error(err)

return{
statusCode:500,
body:JSON.stringify({
error:err.message
})
}

}

}