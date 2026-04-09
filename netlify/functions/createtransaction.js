const midtransClient = require("midtrans-client");

exports.handler = async (event) => {
    // 1. Pastikan hanya menerima request POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY 
        });

        const body = JSON.parse(event.body);
        const customerName = body.customerName || "Pelanggan"; // Mengambil nama dari revisi index.html

        // 2. Mapping Item dari Cart
        let items = body.items.map(i => ({
            id: String(i.id),
            price: Number(i.price),
            quantity: Number(i.qty),
            name: i.name
        }));

        // 3. Hitung Subtotal
        let subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        // 4. Hitung Service (5%) & Tax (10%) agar sama dengan perhitungan di index.html
        const service = Math.round(subtotal * 0.05);
        const tax = Math.round(subtotal * 0.10);

        // 5. Masukkan Service & Tax ke dalam list item agar muncul di struk Midtrans
        items.push({
            id: "service-charge",
            price: service,
            quantity: 1,
            name: "Service Charge (5%)"
        });

        items.push({
            id: "tax-ppn",
            price: tax,
            quantity: 1,
            name: "Tax (10%)"
        });

        // 6. Hitung Total Akhir (Gross Amount)
        const grossAmount = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        // 7. Parameter Transaksi Lengkap
        const parameter = {
            transaction_details: {
                order_id: "ATELIER-" + Date.now(),
                gross_amount: grossAmount
            },
            item_details: items,
            customer_details: {
                first_name: customerName, // Nama yang diinput user di index.html
                email: "customer@example.com" // Opsional
            },
            // Mengatur agar UI Midtrans otomatis menggunakan Bahasa Indonesia
            ui_messages: {
                payment_status_failed: "Pembayaran Gagal",
                payment_status_success: "Pembayaran Berhasil"
            }
        };

        const transaction = await snap.createTransaction(parameter);

        return {
            statusCode: 200,
            body: JSON.stringify({
                token: transaction.token
            })
        };

    } catch (err) {
        console.error("Midtrans Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: err.message
            })
        };
    }
};