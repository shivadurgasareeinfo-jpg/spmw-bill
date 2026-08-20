/* =========================================================
   SP MEDIA WORKS
   STATIC BILL GENERATOR
   ========================================================= */


/* =========================
   GLOBAL DATA
========================= */

let services = [];

let currentBillId = null;

let billStatus = "DUE";

const STORAGE_KEY = "sp_media_works_bills";


/* =========================
   INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeBill();

    addService();

    updatePreview();

});


/* =========================
   BILL INITIALIZATION
========================= */

function initializeBill() {

    document.getElementById("billNumber").value =
        generateBillNumber();

    document.getElementById("billDate").value =
        getToday();

}


/* =========================
   DATE
========================= */

function getToday() {

    const today = new Date();

    return today.toISOString().split("T")[0];

}


function formatDate(date) {

    if (!date) return "—";

    const d = new Date(date);

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


/* =========================
   BILL NUMBER
========================= */

function generateBillNumber() {

    const bills = getBills();

    let maxNumber = 0;

    bills.forEach(bill => {

        const match =
            String(bill.billNumber || "").match(/(\d+)$/);

        if (match) {

            maxNumber =
                Math.max(maxNumber, Number(match[1]));

        }

    });

    return "SPMW-" +
        String(maxNumber + 1).padStart(4, "0");

}


/* =========================
   SERVICE MANAGEMENT
========================= */

function addService(
    description = "",
    qty = 1,
    rate = 0
) {

    services.push({
        description,
        qty,
        rate
    });

    renderServices();

    updatePreview();

}


function removeService(index) {

    if (services.length === 1) {

        services[0] = {
            description: "",
            qty: 1,
            rate: 0
        };

    } else {

        services.splice(index, 1);

    }

    renderServices();

    updatePreview();

}


function renderServices() {

    const list =
        document.getElementById("serviceList");

    list.innerHTML = "";

    services.forEach((service, index) => {

        const row =
            document.createElement("div");

        row.className = "service-row";

        row.innerHTML = `

            <input
                type="text"
                placeholder="Service / description"
                value="${escapeHTML(service.description)}"
                oninput="changeService(${index}, 'description', this.value)"
            >

            <input
                type="number"
                min="1"
                value="${service.qty}"
                oninput="changeService(${index}, 'qty', this.value)"
            >

            <input
                type="number"
                min="0"
                value="${service.rate}"
                oninput="changeService(${index}, 'rate', this.value)"
            >

            <div
                class="service-amount"
                id="serviceAmount${index}">
                ${money(service.qty * service.rate)}
            </div>

            <button
                class="remove-service"
                onclick="removeService(${index})">
                ×
            </button>

        `;

        list.appendChild(row);

    });

}


function changeService(index, field, value) {

    if (field === "qty" ||
        field === "rate") {

        value = Number(value) || 0;

    }

    services[index][field] = value;

    renderServices();

    updatePreview();

}


/* =========================
   CALCULATIONS
========================= */

function calculateSubtotal() {

    return services.reduce(
        (total, service) => {

            return total +
                (Number(service.qty) || 0) *
                (Number(service.rate) || 0);

        },
        0
    );

}


function calculateTotal() {

    const subtotal =
        calculateSubtotal();

    const discount =
        Number(
            document.getElementById("discount").value
        ) || 0;

    return Math.max(
        0,
        subtotal - discount
    );

}


/* =========================
   MONEY
========================= */

function money(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(Number(amount) || 0);

}


/* =========================
   PREVIEW
========================= */

function updatePreview() {

    const client =
        document.getElementById("clientName").value
        || "Client Name";

    const company =
        document.getElementById("company").value
        || "Company / Business";

    const phone =
        document.getElementById("phone").value
        || "+91 XXXXX XXXXX";

    const location =
        document.getElementById("location").value
        || "Vijayawada, Andhra Pradesh";

    const billNumber =
        document.getElementById("billNumber").value
        || "SPMW-0001";

    const date =
        document.getElementById("billDate").value;

    const dueDate =
        document.getElementById("dueDate").value;

    const upi =
        document.getElementById("upi").value
        || "yourupi@upi";

    const notes =
        document.getElementById("notes").value
        || "Thank you for choosing SP Media Works.";

    const subtotal =
        calculateSubtotal();

    const discount =
        Number(
            document.getElementById("discount").value
        ) || 0;

    const total =
        calculateTotal();


    /* CLIENT */

    document.getElementById(
        "previewClient"
    ).textContent = client;

    document.getElementById(
        "previewCompany"
    ).textContent = company;

    document.getElementById(
        "previewPhone"
    ).textContent = phone;

    document.getElementById(
        "previewLocation"
    ).textContent = location;


    /* BILL */

    document.getElementById(
        "previewBillNumber"
    ).textContent = "#" + billNumber;

    document.getElementById(
        "previewDate"
    ).textContent = formatDate(date);

    document.getElementById(
        "previewDueDate"
    ).textContent = formatDate(dueDate);


    /* PAYMENT */

    document.getElementById(
        "previewUPI"
    ).textContent = upi;

    document.getElementById(
        "previewNotes"
    ).textContent = notes;


    /* TOTALS */

    document.getElementById(
        "editorSubtotal"
    ).textContent = money(subtotal);

    document.getElementById(
        "editorDiscount"
    ).textContent = "- " + money(discount);

    document.getElementById(
        "editorTotal"
    ).textContent = money(total);

    document.getElementById(
        "previewSubtotal"
    ).textContent = money(subtotal);

    document.getElementById(
        "previewDiscount"
    ).textContent = "- " + money(discount);

    document.getElementById(
        "previewTotal"
    ).textContent = money(total);


    /* STATUS */

    updateStatus();


    /* TABLE */

    renderInvoiceItems();

}


function renderInvoiceItems() {

    const tbody =
        document.getElementById(
            "invoiceItems"
        );

    tbody.innerHTML = "";

    services.forEach(
        (service, index) => {

            const amount =
                (Number(service.qty) || 0) *
                (Number(service.rate) || 0);

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${String(index + 1).padStart(2, "0")}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            service.description ||
                            "Service description"
                        )}
                    </strong>
                </td>

                <td>
                    ${service.qty || 0}
                </td>

                <td>
                    ${money(service.rate)}
                </td>

                <td>
                    ${money(amount)}
                </td>

            `;

            tbody.appendChild(row);

        }
    );

}


/* =========================
   STATUS
========================= */

function updateStatus() {

    const status =
        document.getElementById(
            "previewStatus"
        );

    const heading =
        document.getElementById(
            "invoiceType"
        );

    const footer =
        document.getElementById(
            "invoiceFooter"
        );


    if (billStatus === "PAID") {

        status.textContent =
            "PAID";

        status.className =
            "status paid";

        heading.textContent =
            "PAYMENT RECEIPT";

        footer.className =
            "invoice-footer paid";

        footer.innerHTML = `

            <strong>
                ✓ PAYMENT RECEIVED
            </strong>

            <span>
                Payment has been successfully received.
            </span>

        `;

        document.getElementById(
            "markPaidButton"
        ).style.display = "none";

    } else {

        status.textContent =
            "PAYMENT DUE";

        status.className =
            "status due";

        heading.textContent =
            "PAYMENT BILL";

        footer.className =
            "invoice-footer";

        footer.innerHTML = `

            <strong>
                PAYMENT DUE
            </strong>

            <span>
                Please complete payment using
                the provided UPI details.
            </span>

        `;

        document.getElementById(
            "markPaidButton"
        ).style.display =
            "inline-flex";

    }

}


/* =========================
   MARK AS PAID
========================= */

function markPaid() {

    billStatus = "PAID";

    saveBill();

    updateStatus();

}


/* =========================
   SAVE BILL
========================= */

function saveBill() {

    const bill = collectBillData();

    const bills = getBills();

    if (currentBillId) {

        const index =
            bills.findIndex(
                b => b.id === currentBillId
            );

        if (index !== -1) {

            bills[index] = bill;

        } else {

            bills.unshift(bill);

        }

    } else {

        bills.unshift(bill);

    }

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bills)
    );

    currentBillId = bill.id;

    alert(
        billStatus === "PAID"
            ? "Paid receipt saved successfully."
            : "Bill saved successfully."
    );

    renderHistory();

}


/* =========================
   COLLECT BILL
========================= */

function collectBillData() {

    return {

        id:
            currentBillId ||
            Date.now().toString(),

        billNumber:
            document.getElementById(
                "billNumber"
            ).value,

        date:
            document.getElementById(
                "billDate"
            ).value,

        dueDate:
            document.getElementById(
                "dueDate"
            ).value,

        status:
            billStatus,

        client: {

            name:
                document.getElementById(
                    "clientName"
                ).value,

            company:
                document.getElementById(
                    "company"
                ).value,

            phone:
                document.getElementById(
                    "phone"
                ).value,

            email:
                document.getElementById(
                    "email"
                ).value,

            location:
                document.getElementById(
                    "location"
                ).value

        },

        services:
            services,

        discount:
            Number(
                document.getElementById(
                    "discount"
                ).value
            ) || 0,

        upi:
            document.getElementById(
                "upi"
            ).value,

        paymentReference:
            document.getElementById(
                "paymentReference"
            ).value,

        notes:
            document.getElementById(
                "notes"
            ).value

    };

}


/* =========================
   GET BILLS
========================= */

function getBills() {

    return JSON.parse(
        localStorage.getItem(
            STORAGE_KEY
        ) || "[]"
    );

}


/* =========================
   HISTORY
========================= */

function renderHistory() {

    const container =
        document.getElementById(
            "billHistory"
        );

    const search =
        (
            document.getElementById(
                "searchBills"
            )?.value || ""
        ).toLowerCase();

    const bills =
        getBills().filter(bill => {

            return (
                String(
                    bill.billNumber
                ).toLowerCase().includes(search)
                ||
                String(
                    bill.client?.name
                ).toLowerCase().includes(search)
            );

        });


    if (!bills.length) {

        container.innerHTML = `

            <div class="empty-history">

                No saved bills found.

            </div>

        `;

        return;

    }


    container.innerHTML = "";

    bills.forEach(bill => {

        const subtotal =
            (bill.services || []).reduce(
                (sum, item) => {

                    return sum +
                        (Number(item.qty) || 0) *
                        (Number(item.rate) || 0);

                },
                0
            );

        const total =
            Math.max(
                0,
                subtotal -
                (Number(bill.discount) || 0)
            );


        const row =
            document.createElement("div");

        row.className =
            "history-row";


        row.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(
                        bill.billNumber
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        bill.client?.name ||
                        "Unnamed client"
                    )}
                </small>

            </div>


            <div>
                <small>
                    ${formatDate(bill.date)}
                </small>
            </div>


            <div class="history-total">
                ${money(total)}
            </div>


            <div>

                <span class="status ${
                    bill.status === "PAID"
                        ? "paid"
                        : "due"
                }">

                    ${
                        bill.status === "PAID"
                            ? "PAID"
                            : "DUE"
                    }

                </span>

            </div>


            <button
                class="history-open"
                onclick="openBill('${bill.id}')">

                Open

            </button>


            <button
                class="history-delete"
                onclick="deleteBill('${bill.id}')">

                ×

            </button>

        `;

        container.appendChild(row);

    });

}


/* =========================
   OPEN BILL
========================= */

function openBill(id) {

    const bills =
        getBills();

    const bill =
        bills.find(
            b => b.id === id
        );

    if (!bill) return;


    currentBillId =
        bill.id;

    billStatus =
        bill.status || "DUE";


    document.getElementById(
        "clientName"
    ).value =
        bill.client?.name || "";

    document.getElementById(
        "company"
    ).value =
        bill.client?.company || "";

    document.getElementById(
        "phone"
    ).value =
        bill.client?.phone || "";

    document.getElementById(
        "email"
    ).value =
        bill.client?.email || "";

    document.getElementById(
        "location"
    ).value =
        bill.client?.location || "";

    document.getElementById(
        "billNumber"
    ).value =
        bill.billNumber;

    document.getElementById(
        "billDate"
    ).value =
        bill.date || "";

    document.getElementById(
        "dueDate"
    ).value =
        bill.dueDate || "";

    document.getElementById(
        "discount"
    ).value =
        bill.discount || 0;

    document.getElementById(
        "upi"
    ).value =
        bill.upi || "";

    document.getElementById(
        "paymentReference"
    ).value =
        bill.paymentReference || "";

    document.getElementById(
        "notes"
    ).value =
        bill.notes || "";


    services =
        bill.services || [];


    renderServices();

    updatePreview();

    showPage("create");

}


/* =========================
   DELETE BILL
========================= */

function deleteBill(id) {

    if (!confirm(
        "Are you sure you want to delete this bill?"
    )) {

        return;

    }


    let bills =
        getBills();

    bills =
        bills.filter(
            bill => bill.id !== id
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bills)
    );


    renderHistory();

}


/* =========================
   NEW BILL
========================= */

function newBill() {

    currentBillId = null;

    billStatus = "DUE";

    document.getElementById(
        "clientName"
    ).value = "";

    document.getElementById(
        "company"
    ).value = "";

    document.getElementById(
        "phone"
    ).value = "";

    document.getElementById(
        "email"
    ).value = "";

    document.getElementById(
        "location"
    ).value = "";

    document.getElementById(
        "billNumber"
    ).value =
        generateBillNumber();

    document.getElementById(
        "billDate"
    ).value =
        getToday();

    document.getElementById(
        "dueDate"
    ).value = "";

    document.getElementById(
        "discount"
    ).value = 0;

    document.getElementById(
        "paymentReference"
    ).value = "";

    document.getElementById(
        "notes"
    ).value =
        "Thank you for choosing SP Media Works.";


    services = [];

    addService();

    updatePreview();

    showPage("create");

}


/* =========================
   PAGE SWITCHING
========================= */

function showPage(page) {

    const createPage =
        document.getElementById(
            "createPage"
        );

    const historyPage =
        document.getElementById(
            "historyPage"
        );

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (page === "history") {

        createPage.classList.add(
            "hidden"
        );

        historyPage.classList.remove(
            "hidden"
        );

        pageTitle.textContent =
            "Bill History";

        renderHistory();

    } else {

        historyPage.classList.add(
            "hidden"
        );

        createPage.classList.remove(
            "hidden"
        );

        pageTitle.textContent =
            "Create Bill";

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    if (page === "history") {

        document
            .querySelectorAll(".nav-btn")[1]
            .classList.add("active");

    } else {

        document
            .querySelectorAll(".nav-btn")[0]
            .classList.add("active");

    }

}


/* =========================
   DOWNLOAD PDF
========================= */

async function downloadPDF() {

    const invoice =
        document.getElementById(
            "invoice"
        );


    const canvas =
        await html2canvas(
            invoice,
            {
                scale: 2,

                backgroundColor:
                    "#ffffff",

                useCORS: true
            }
        );


    const image =
        canvas.toDataURL(
            "image/png"
        );


    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );


    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin = 8;

    const availableWidth =
        pageWidth -
        margin * 2;


    const ratio =
        canvas.height /
        canvas.width;


    const imageHeight =
        availableWidth *
        ratio;


    let height =
        imageHeight;


    if (height >
        pageHeight - margin * 2) {

        height =
            pageHeight - margin * 2;

    }


    pdf.addImage(
        image,
        "PNG",
        margin,
        margin,
        availableWidth,
        height
    );


    const number =
        document.getElementById(
            "billNumber"
        ).value ||
        "SPMW-BILL";


    const suffix =
        billStatus === "PAID"
            ? "PAID"
            : "PAYMENT-DUE";


    pdf.save(
        `${number}-${suffix}.pdf`
    );

}


/* =========================
   SECURITY / TEXT
========================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
