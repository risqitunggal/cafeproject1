const midtransClient = require("midtrans-client")

exports.handler = async (event) => {

const snap = new midtransClient.Snap({
isProduction:false,
serverKey:process.env.MIDTRANS_SERVER_KEY
})

const body = JSON.parse(event.body)

const parameter = {
transaction_details:{
order_id:"ORDER-"+Date.now(),
gross_amount:body.total
},
item_details:body.items.map(i=>({
id:i.id,
price:i.price,
quantity:i.qty,
name:i.name
}))
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

return{
statusCode:500,
body:JSON.stringify({
error:err.message
})
}

}

}