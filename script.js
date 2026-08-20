const STORAGE_KEY = "sp_media_works_bills_v2";

let services = [];
let currentBillId = null;
let billStatus = "DUE";
let qrData = "";
let generatedAt = new Date().toISOString();

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeBill();

    services = [];
    addService(false);

    updatePreview();
    renderHistory();
});

function initializeBill() {
    setValue("billNumber", generateBillNumber());
    setValue("billDate", getToday());

    if (!getValue("notes")) {
        setValue(
            "notes",
            "Thank you for choosing SP Media Works."
        );
    }

    if (!getValue("terms")) {
        setValue(
            "terms",
            defaultTerms()
        );
    }

    bindStaticEvents();
}


/* =========================================================
   DEFAULT TERMS
========================================================= */

function defaultTerms() {
    return `• Payment is due as specified on this bill.
• Confirmed payments are non-refundable once work has commenced.
• Additional revisions or services outside the agreed scope may incur extra charges.
• Delivery timelines depend on project requirements and timely client feedback.
• Delays caused by pending client approvals or required materials may affect delivery timelines.
• Final files will be delivered after full payment unless otherwise agreed.
• By making the payment, the client agrees to these terms and conditions.`;
}


/* =========================================================
   STATIC EVENTS
========================================================= */

function bindStaticEvents() {

    const addButton = document.getElementById("addServiceButton");

    if (addButton) {
        addButton.addEventListener("click", function (e) {
            e.preventDefault();
            addService(true);
        });
    }

    const discount = document.getElementById("discount");

    if (discount) {
        discount.addEventListener("input", function () {
            updatePreview();
        });
    }

    const qrUpload = document.getElementById("qrUpload");

    if (qrUpload) {
        qrUpload.addEventListener("change", handleQRUpload);
    }

    const removeQRButton = document.getElementById("removeQR");

    if (removeQRButton) {
        removeQRButton.addEventListener("click", removeQR);
    }

    const search = document.getElementById("searchBills");

    if (search) {
        search.addEventListener("input", renderHistory);
    }

    const fields = [
        "clientName",
        "company",
        "phone",
        "email",
        "location",
        "billNumber",
        "billDate",
        "dueDate",
        "upi",
        "paymentReference",
        "notes",
        "terms"
    ];

    fields.forEach(id => {

        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener("input", function () {
            updatePreview();
        });

        element.addEventListener("change", function () {
            updatePreview();
        });
    });
}


/* =========================================================
   DATE
========================================================= */

function getToday() {

    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


function formatDate(value) {

    if (!value) return "—";

    const d = new Date(value + "T00:00:00");

    if (isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function formatDateTime(value) {

    const d = value ? new Date(value) : new Date();

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


/* =========================================================
   BILL NUMBER
========================================================= */

function generateBillNumber() {

    let max = 0;

    getBills().forEach(bill => {

        const match = String(bill.billNumber || "").match(/(\d+)$/);

        if (match) {
            max = Math.max(max, Number(match[1]));
        }
    });

    return "SPMW-" + String(max + 1).padStart(4, "0");
}


/* =========================================================
   SERVICES
========================================================= */

function addService(focusNew = true) {

    services.push({
        description: "",
        qty: 1,
        rate: 0
    });

    renderServices();
    updatePreview();

    if (focusNew) {

        setTimeout(() => {

            const elements =
                document.querySelectorAll(".service-description");

            const last =
                elements[elements.length - 1];

            if (last) {

                last.focus();

                try {
                    last.setSelectionRange(
                        last.value.length,
                        last.value.length
                    );
                } catch (error) {}

            }

        }, 50);
    }
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

    const list = document.getElementById("serviceList");

    if (!list) return;

    /*
       IMPORTANT:
       We completely avoid rebuilding the service DOM
       while the user is typing.

       This fixes:
       "I type one letter and cursor disappears."
    */

    list.innerHTML = "";

    services.forEach((service, index) => {

        const row = document.createElement("div");

        row.className = "service-row";


        /* DESCRIPTION */

        const description = document.createElement("input");

        description.className = "service-description";

        description.type = "text";

        description.placeholder = "Service / description";

        description.value = service.description;


        description.addEventListener("input", function () {

            services[index].description = this.value;

            updateServiceAmount(row, index);

            updateInvoiceOnly();

        });


        /* QUANTITY */

        const quantity = document.createElement("input");

        quantity.className = "service-qty";

        quantity.type = "number";

        quantity.min = "1";

        quantity.step = "1";

        quantity.value = service.qty;


        quantity.addEventListener("input", function () {

            services[index].qty =
                Number(this.value) || 0;

            updateServiceAmount(row, index);

            updateInvoiceOnly();

        });


        /* RATE */

        const rate = document.createElement("input");

        rate.className = "service-rate";

        rate.type = "number";

        rate.min = "0";

        rate.step = "1";

        rate.value = service.rate;


        rate.addEventListener("input", function () {

            services[index].rate =
                Number(this.value) || 0;

            updateServiceAmount(row, index);

            updateInvoiceOnly();

        });


        /* AMOUNT */

        const amount = document.createElement("div");

        amount.className = "service-amount";


        /* REMOVE */

        const remove = document.createElement("button");

        remove.type = "button";

        remove.className = "remove-service";

        remove.textContent = "×";

        remove.title = "Remove service";


        remove.addEventListener("click", function (e) {

            e.preventDefault();

            removeService(index);

        });


        row.appendChild(description);
        row.appendChild(quantity);
        row.appendChild(rate);
        row.appendChild(amount);
        row.appendChild(remove);

        list.appendChild(row);

        updateServiceAmount(row, index);

    });
}


function updateServiceAmount(row, index) {

    if (!services[index]) return;

    const service = services[index];

    const quantity =
        Number(service.qty) || 0;

    const rate =
        Number(service.rate) || 0;

    const total =
        quantity * rate;

    const amount =
        row.querySelector(".service-amount");

    if (amount) {
        amount.textContent = money(total);
    }
}


/* =========================================================
   CALCULATIONS
========================================================= */

function calculateSubtotal() {

    return services.reduce((total, service) => {

        const quantity =
            Number(service.qty) || 0;

        const rate =
            Number(service.rate) || 0;

        return total + quantity * rate;

    }, 0);
}


function getDiscount() {

    const element =
        document.getElementById("discount");

    if (!element) return 0;

    return Math.max(
        0,
        Number(element.value) || 0
    );
}


function calculateTotal() {

    const subtotal =
        calculateSubtotal();

    const discount =
        getDiscount();

    return Math.max(
        0,
        subtotal - discount
    );
}


/* =========================================================
   MONEY
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0);
}


/* =========================================================
   NUMBER TO WORDS
========================================================= */

function numberToWords(number) {

    number =
        Math.floor(Number(number) || 0);

    if (number === 0) {
        return "Rupees Zero Only";
    }

    const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen"
    ];

    const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety"
    ];


    function twoDigits(num) {

        if (num < 20) {
            return ones[num];
        }

        return (
            tens[Math.floor(num / 10)] +
            (num % 10
                ? " " + ones[num % 10]
                : "")
        );
    }


    function convertPart(num) {

        let result = "";

        if (num >= 100) {

            result +=
                ones[Math.floor(num / 100)] +
                " Hundred";

            num %= 100;

            if (num) {
                result += " ";
            }
        }

        if (num) {
            result += twoDigits(num);
        }

        return result;
    }


    let result = "";


    if (number >= 10000000) {

        result +=
            convertPart(
                Math.floor(number / 10000000)
            ) +
            " Crore ";

        number %= 10000000;
    }


    if (number >= 100000) {

        result +=
            convertPart(
                Math.floor(number / 100000)
            ) +
            " Lakh ";

        number %= 100000;
    }


    if (number >= 1000) {

        result +=
            convertPart(
                Math.floor(number / 1000)
            ) +
            " Thousand ";

        number %= 1000;
    }


    if (number) {
        result += convertPart(number);
    }


    return "Rupees " +
        result.trim() +
        " Only";
}


/* =========================================================
   PREVIEW
========================================================= */

function updatePreview() {

    updateInvoicePreview();

}


function updateInvoiceOnly() {

    updateInvoicePreview();

}


function updateInvoicePreview() {

    /* CLIENT */

    setText(
        "previewClient",
        getValue(
            "clientName",
            "Client Name"
        )
    );


    setText(
        "previewCompany",
        getValue(
            "company",
            "Company / Business"
        )
    );


    setText(
        "previewPhone",
        getValue(
            "phone",
            "+91 XXXXX XXXXX"
        )
    );


    setText(
        "previewLocation",
        getValue(
            "location",
            "Vijayawada, Andhra Pradesh"
        )
    );


    /* BILL */

    setText(
        "previewBillNumber",
        "#" +
        getValue(
            "billNumber",
            "SPMW-0001"
        )
    );


    setText(
        "previewDate",
        formatDate(
            getValue("billDate", "")
        )
    );


    setText(
        "previewDueDate",
        formatDate(
            getValue("dueDate", "")
        )
    );


    /* UPI */

    const upi =
        getValue(
            "upi",
            "yourupi@upi"
        );

    setText(
        "previewUPI",
        upi
    );


    /* NOTES */

    setText(
        "previewNotes",
        getValue(
            "notes",
            "Thank you for choosing SP Media Works."
        )
    );


    /* TERMS */

    setText(
        "previewTerms",
        getValue(
            "terms",
            defaultTerms()
        )
    );


    /* TOTALS */

    const subtotal =
        calculateSubtotal();

    const discount =
        getDiscount();

    const total =
        calculateTotal();


    setText(
        "editorSubtotal",
        money(subtotal)
    );


    setText(
        "editorDiscount",
        "- " + money(discount)
    );


    setText(
        "editorTotal",
        money(total)
    );


    setText(
        "previewSubtotal",
        money(subtotal)
    );


    setText(
        "previewDiscount",
        "- " + money(discount)
    );


    setText(
        "previewTotal",
        money(total)
    );


    setText(
        "amountWords",
        numberToWords(total)
    );


    /* PAYMENT REFERENCE */

    const reference =
        getValue(
            "paymentReference",
            ""
        );


    const referencePreview =
        document.getElementById(
            "paymentReferencePreview"
        );


    if (referencePreview) {

        referencePreview.innerHTML =
            reference
                ? `PAYMENT REFERENCE: <strong>${escapeHTML(reference)}</strong>`
                : "";

    }


    renderInvoiceItems();

    updateQRPreview();

    updateStatus();

}


/* =========================================================
   INVOICE ITEMS
========================================================= */

function renderInvoiceItems() {

    const tbody =
        document.getElementById(
            "invoiceItems"
        );

    if (!tbody) return;

    tbody.innerHTML = "";


    services.forEach(
        (service, index) => {

            const amount =
                (Number(service.qty) || 0) *
                (Number(service.rate) || 0);


            const row =
                document.createElement("tr");


            const values = [
                String(index + 1).padStart(2, "0"),
                service.description ||
                "Service description",
                service.qty || 0,
                money(service.rate),
                money(amount)
            ];


            values.forEach(
                (value, columnIndex) => {

                    const cell =
                        document.createElement("td");


                    if (columnIndex === 1) {

                        const strong =
                            document.createElement("strong");

                        strong.textContent = value;

                        cell.appendChild(strong);

                    } else {

                        cell.textContent = value;

                    }


                    row.appendChild(cell);

                }
            );


            tbody.appendChild(row);

        }
    );
}


/* =========================================================
   STATUS
========================================================= */

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


    const button =
        document.getElementById(
            "markPaidButton"
        );


    /* STATUS */

    if (status) {

        status.textContent =
            billStatus === "PAID"
                ? "PAID"
                : "PAYMENT DUE";


        status.className =
            "status " +
            (
                billStatus === "PAID"
                    ? "paid"
                    : "due"
            );

    }


    /* HEADING */

    if (heading) {

        heading.textContent =
            billStatus === "PAID"
                ? "PAYMENT RECEIPT"
                : "PAYMENT BILL";

    }


    /* FOOTER */

    if (footer) {

        footer.className =
            "invoice-footer" +
            (
                billStatus === "PAID"
                    ? " paid"
                    : ""
            );


        footer.innerHTML = `

            <div class="invoice-footer-main">

                <strong>
                    ${
                        billStatus === "PAID"
                            ? "✓ PAYMENT RECEIVED"
                            : "PAYMENT DUE"
                    }
                </strong>

                <span>
                    ${
                        billStatus === "PAID"
                            ? "Payment has been successfully received."
                            : "Please complete payment using the provided UPI details."
                    }
                </span>

            </div>


            <div class="generated-footer">

                <span>
                    This is a computer-generated slip and does not require a signature.
                </span>

                <span>
                    Generated on: ${formatDateTime(generatedAt)}
                </span>

            </div>

        `;

    }


    /* MARK PAID BUTTON */

    if (button) {

        button.style.display =
            billStatus === "PAID"
                ? "none"
                : "inline-flex";

    }
}


/* =========================================================
   QR CODE
========================================================= */

function handleQRUpload(event) {

    const file =
        event.target.files?.[0];

    if (!file) return;


    if (!file.type.startsWith("image/")) {

        alert(
            "Please select a valid QR image."
        );

        event.target.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            qrData =
                event.target.result;


            setText(
                "qrFileName",
                file.name
            );


            updateQRPreview();

        };


    reader.readAsDataURL(file);
}


function updateQRPreview() {

    const image =
        document.getElementById(
            "previewQR"
        );


    const placeholder =
        document.getElementById(
            "qrPlaceholder"
        );


    if (!image) return;


    if (qrData) {

        image.src = qrData;

        image.style.display =
            "block";


        if (placeholder) {

            placeholder.style.display =
                "none";

        }

    } else {

        image.removeAttribute("src");

        image.style.display =
            "none";


        if (placeholder) {

            placeholder.style.display =
                "inline";

        }
    }
}


function removeQR() {

    qrData = "";


    const input =
        document.getElementById(
            "qrUpload"
        );


    if (input) {
        input.value = "";
    }


    setText(
        "qrFileName",
        "No QR selected"
    );


    updateQRPreview();
}


/* =========================================================
   MARK PAID
========================================================= */

function markPaid() {

    const total =
        calculateTotal();


    if (total <= 0) {

        if (
            !confirm(
                "The total amount is ₹0. Continue and mark this bill as paid?"
            )
        ) {
            return;
        }
    }


    billStatus = "PAID";

    generatedAt =
        new Date().toISOString();


    saveBill(true);

    updatePreview();


    alert(
        "Payment marked as PAID.\n\nYour payment receipt is ready."
    );
}


/* =========================================================
   COLLECT BILL
========================================================= */

function collectBill() {

    return {

        id:
            currentBillId ||
            Date.now().toString(),


        billNumber:
            getValue("billNumber", ""),


        date:
            getValue("billDate", ""),


        dueDate:
            getValue("dueDate", ""),


        status:
            billStatus,


        generatedAt,


        client: {

            name:
                getValue("clientName", ""),

            company:
                getValue("company", ""),

            phone:
                getValue("phone", ""),

            email:
                getValue("email", ""),

            location:
                getValue("location", "")

        },


        services:
            services.map(service => ({

                description:
                    service.description || "",

                qty:
                    Number(service.qty) || 0,

                rate:
                    Number(service.rate) || 0

            })),


        discount:
            getDiscount(),


        upi:
            getValue("upi", ""),


        qrData,


        paymentReference:
            getValue(
                "paymentReference",
                ""
            ),


        notes:
            getValue(
                "notes",
                ""
            ),


        terms:
            getValue(
                "terms",
                ""
            )

    };
}


/* =========================================================
   SAVE BILL
========================================================= */

function saveBill(silent = false) {

    const bill =
        collectBill();


    const bills =
        getBills();


    const existingIndex =
        bills.findIndex(
            item =>
                item.id === bill.id
        );


    if (existingIndex >= 0) {

        bills[existingIndex] =
            bill;

    } else {

        bills.unshift(bill);

    }


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bills)
    );


    currentBillId =
        bill.id;


    renderHistory();


    if (!silent) {

        alert(
            billStatus === "PAID"
                ? "Paid receipt saved successfully."
                : "Bill saved successfully."
        );

    }
}


/* =========================================================
   GET BILLS
========================================================= */

function getBills() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEY
            ) || "[]"
        );

    } catch (error) {

        console.error(
            "Could not read bills:",
            error
        );

        return [];

    }
}


/* =========================================================
   OPEN BILL
========================================================= */

function openBill(id) {

    const bill =
        getBills().find(
            item =>
                item.id === id
        );


    if (!bill) return;


    currentBillId =
        bill.id;


    billStatus =
        bill.status || "DUE";


    generatedAt =
        bill.generatedAt ||
        new Date().toISOString();


    setValue(
        "clientName",
        bill.client?.name || ""
    );


    setValue(
        "company",
        bill.client?.company || ""
    );


    setValue(
        "phone",
        bill.client?.phone || ""
    );


    setValue(
        "email",
        bill.client?.email || ""
    );


    setValue(
        "location",
        bill.client?.location || ""
    );


    setValue(
        "billNumber",
        bill.billNumber || ""
    );


    setValue(
        "billDate",
        bill.date || ""
    );


    setValue(
        "dueDate",
        bill.dueDate || ""
    );


    setValue(
        "discount",
        bill.discount || 0
    );


    setValue(
        "upi",
        bill.upi || ""
    );


    setValue(
        "paymentReference",
        bill.paymentReference || ""
    );


    setValue(
        "notes",
        bill.notes || ""
    );


    setValue(
        "terms",
        bill.terms || defaultTerms()
    );


    qrData =
        bill.qrData || "";


    setText(
        "qrFileName",
        qrData
            ? "QR code saved"
            : "No QR selected"
    );


    services =
        Array.isArray(bill.services)
            ? bill.services.map(
                service => ({
                    description:
                        service.description || "",

                    qty:
                        Number(service.qty) || 0,

                    rate:
                        Number(service.rate) || 0
                })
            )
            : [];


    if (!services.length) {

        services = [
            {
                description: "",
                qty: 1,
                rate: 0
            }
        ];

    }


    renderServices();

    updatePreview();

    showPage("create");
}


/* =========================================================
   DELETE BILL
========================================================= */

function deleteBill(id) {

    if (
        !confirm(
            "Delete this bill permanently?"
        )
    ) {
        return;
    }


    const updated =
        getBills().filter(
            bill =>
                bill.id !== id
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
    );


    if (currentBillId === id) {

        currentBillId = null;

    }


    renderHistory();
}


/* =========================================================
   NEW BILL
========================================================= */

function newBill() {

    currentBillId = null;

    billStatus = "DUE";

    generatedAt =
        new Date().toISOString();

    qrData = "";


    [
        "clientName",
        "company",
        "phone",
        "email",
        "location",
        "upi",
        "paymentReference"
    ].forEach(
        id =>
            setValue(id, "")
    );


    setValue(
        "billNumber",
        generateBillNumber()
    );


    setValue(
        "billDate",
        getToday()
    );


    setValue(
        "dueDate",
        ""
    );


    setValue(
        "discount",
        0
    );


    setValue(
        "notes",
        "Thank you for choosing SP Media Works."
    );


    setValue(
        "terms",
        defaultTerms()
    );


    const qr =
        document.getElementById(
            "qrUpload"
        );


    if (qr) {
        qr.value = "";
    }


    setText(
        "qrFileName",
        "No QR selected"
    );


    services = [];


    addService(true);


    showPage("create");

}


/* =========================================================
   PAGE SWITCHING
========================================================= */

function showPage(page) {

    const createPage =
        document.getElementById(
            "createPage"
        );


    const historyPage =
        document.getElementById(
            "historyPage"
        );


    document
        .querySelectorAll(".nav-btn")
        .forEach(button =>
            button.classList.remove(
                "active"
            )
        );


    if (page === "history") {

        if (createPage)
            createPage.classList.add(
                "hidden"
            );


        if (historyPage)
            historyPage.classList.remove(
                "hidden"
            );


        document
            .querySelectorAll(".nav-btn")[1]
            ?.classList.add("active");


        setText(
            "pageTitle",
            "Bill History"
        );


        renderHistory();

    } else {

        if (historyPage)
            historyPage.classList.add(
                "hidden"
            );


        if (createPage)
            createPage.classList.remove(
                "hidden"
            );


        document
            .querySelectorAll(".nav-btn")[0]
            ?.classList.add("active");


        setText(
            "pageTitle",
            "Create Bill"
        );

    }
}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const container =
        document.getElementById(
            "billHistory"
        );


    if (!container) return;


    const search =
        (
            document.getElementById(
                "searchBills"
            )?.value || ""
        )
        .toLowerCase()
        .trim();


    const bills =
        getBills().filter(
            bill => {

                const searchable =
                    [
                        bill.billNumber,
                        bill.client?.name,
                        bill.client?.company,
                        bill.client?.phone
                    ]
                    .join(" ")
                    .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    if (!bills.length) {

        container.innerHTML =
            `<div class="empty-history">
                No saved bills found.
            </div>`;

        return;
    }


    container.innerHTML = "";


    bills.forEach(
        bill => {

            const subtotal =
                (bill.services || [])
                .reduce(
                    (sum, service) =>
                        sum +
                        (
                            Number(service.qty) || 0
                        ) *
                        (
                            Number(service.rate) || 0
                        ),
                    0
                );


            const total =
                Math.max(
                    0,
                    subtotal -
                    (
                        Number(bill.discount) || 0
                    )
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-row";


            row.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(
                            bill.billNumber || ""
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
                        ${formatDate(
                            bill.date
                        )}
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
                    type="button"
                    data-open-id="${escapeHTML(
                        bill.id
                    )}"
                >
                    Open
                </button>


                <button
                    class="history-delete"
                    type="button"
                    data-delete-id="${escapeHTML(
                        bill.id
                    )}"
                >
                    ×
                </button>

            `;


            const openButton =
                row.querySelector(
                    "[data-open-id]"
                );


            const deleteButton =
                row.querySelector(
                    "[data-delete-id]"
                );


            if (openButton) {

                openButton.addEventListener(
                    "click",
                    () =>
                        openBill(
                            bill.id
                        )
                );

            }


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () =>
                        deleteBill(
                            bill.id
                        )
                );

            }


            container.appendChild(row);

        }
    );
}


/* =========================================================
   PDF
========================================================= */

async function downloadPDF() {

    const invoice = document.getElementById("invoice");

    if (!invoice) {
        alert("Invoice not found.");
        return;
    }

    try {

        /*
         * Wait for images
         */
        const images = Array.from(
            invoice.querySelectorAll("img")
        );

        await Promise.all(

            images.map(img => {

                return new Promise(resolve => {

                    if (
                        img.complete &&
                        img.naturalWidth > 0
                    ) {
                        resolve();
                        return;
                    }

                    img.onload = resolve;

                    img.onerror = () => {
                        img.style.display = "none";
                        resolve();
                    };

                    setTimeout(resolve, 3000);

                });

            })

        );


        /*
         * Allow browser to finish rendering
         */
        await new Promise(
            resolve => setTimeout(resolve, 300)
        );


        /*
         * Capture invoice
         */
        const canvas = await html2canvas(
            invoice,
            {
                scale: 3,
                useCORS: true,
                allowTaint: false,
                backgroundColor: "#ffffff",
                logging: false,
                imageTimeout: 10000
            }
        );


        const imgData =
            canvas.toDataURL(
                "image/jpeg",
                0.95
            );


        const {
            jsPDF
        } = window.jspdf;


        /*
         * A4 WIDTH
         */
        const pageWidth = 210;


        /*
         * Calculate height from actual
         * invoice content.
         */
        const pageHeight =
            pageWidth *
            (canvas.height / canvas.width);


        /*
         * Create PDF with EXACT
         * content height.
         */
        const pdf = new jsPDF({

            orientation:
                pageHeight > pageWidth
                    ? "portrait"
                    : "landscape",

            unit: "mm",

            format: [
                pageWidth,
                pageHeight
            ],

            compress: true

        });


        /*
         * Put bill at 0,0
         */
        pdf.addImage(

            imgData,

            "JPEG",

            0,

            0,

            pageWidth,

            pageHeight,

            undefined,

            "FAST"

        );


        /*
         * Filename
         */
        const billNumber =
            document.getElementById(
                "billNumber"
            )?.value ||
            "SPMW-BILL";


        pdf.save(
            `${billNumber}.pdf`
        );


    } catch (error) {

        console.error(
            "PDF generation failed:",
            error
        );

        alert(
            "Could not generate PDF. Please try again."
        );

    }

}


/* =========================================================
   PRINT
========================================================= */

function printBill() {

    generatedAt =
        new Date().toISOString();

    updatePreview();

    window.print();
}


/* =========================================================
   HELPERS
========================================================= */

function getValue(
    id,
    fallback = ""
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return fallback;
    }


    return (
        element.value ||
        fallback
    );
}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value ?? "";

    }
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";

    }
}


function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   EXPOSE FUNCTIONS FOR HTML BUTTONS
========================================================= */

window.addService = addService;
window.removeService = removeService;
window.markPaid = markPaid;
window.saveBill = saveBill;
window.newBill = newBill;
window.openBill = openBill;
window.deleteBill = deleteBill;
window.showPage = showPage;
window.downloadPDF = downloadPDF;
window.printBill = printBill;
window.handleQRUpload = handleQRUpload;
window.removeQR = removeQR;
window.updatePreview = updatePreview;
