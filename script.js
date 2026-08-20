/* =========================================================
   SP MEDIA WORKS — BILL GENERATOR
   FRONTEND ONLY
========================================================= */

const STORAGE_KEY = "sp_media_works_bills";

let services = [];
let currentBillId = null;
let billStatus = "DUE";
let qrData = "";
let generatedAt = new Date().toISOString();


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeBill();

    services = [];

    addService(false);

    updateAll();

});


/* =========================================================
   BILL INITIALIZATION
========================================================= */

function initializeBill() {

    const billNumber =
        document.getElementById("billNumber");

    const billDate =
        document.getElementById("billDate");

    if (billNumber) {
        billNumber.value =
            generateBillNumber();
    }

    if (billDate) {
        billDate.value =
            getToday();
    }

}


/* =========================================================
   DATE
========================================================= */

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(
            value + "T00:00:00"
        );

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function formatDateTime(value) {

    const date =
        value
            ? new Date(value)
            : new Date();

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}


/* =========================================================
   BILL NUMBER
========================================================= */

function generateBillNumber() {

    const bills =
        getBills();

    let highest =
        0;

    bills.forEach(function (bill) {

        const match =
            String(
                bill.billNumber || ""
            ).match(
                /(\d+)$/
            );

        if (match) {

            highest =
                Math.max(
                    highest,
                    Number(match[1])
                );

        }

    });

    return (
        "SPMW-" +
        String(
            highest + 1
        ).padStart(
            4,
            "0"
        )
    );

}


/* =========================================================
   ADD SERVICE
========================================================= */

function addService(focusNew = true) {

    services.push({

        description: "",

        qty: 1,

        rate: 0

    });

    renderServices();

    updateInvoicePreview();

    if (focusNew) {

        setTimeout(function () {

            const inputs =
                document.querySelectorAll(
                    ".service-description"
                );

            if (!inputs.length) {
                return;
            }

            const input =
                inputs[
                    inputs.length - 1
                ];

            input.focus();

            input.setSelectionRange(
                input.value.length,
                input.value.length
            );

        }, 20);

    }

}


/* =========================================================
   REMOVE SERVICE
========================================================= */

function removeService(index) {

    if (
        index < 0 ||
        index >= services.length
    ) {
        return;
    }

    services.splice(
        index,
        1
    );

    if (!services.length) {

        services.push({

            description: "",

            qty: 1,

            rate: 0

        });

    }

    renderServices();

    updateInvoicePreview();

}


/* =========================================================
   RENDER SERVICE EDITOR
========================================================= */

function renderServices() {

    const container =
        document.getElementById(
            "serviceList"
        );

    if (!container) {
        return;
    }

    /*
       IMPORTANT:

       This function is ONLY called when:
       - adding a service
       - removing a service
       - loading a saved bill
       - creating a new bill

       It is NEVER called while typing.
    */

    container.innerHTML = "";


    services.forEach(
        function (service, index) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "service-row";


            /* DESCRIPTION */

            const description =
                document.createElement(
                    "input"
                );

            description.type =
                "text";

            description.className =
                "service-description";

            description.placeholder =
                "Service / description";

            description.value =
                service.description || "";


            /* QUANTITY */

            const qty =
                document.createElement(
                    "input"
                );

            qty.type =
                "number";

            qty.className =
                "service-qty";

            qty.min =
                "1";

            qty.value =
                service.qty || 1;


            /* RATE */

            const rate =
                document.createElement(
                    "input"
                );

            rate.type =
                "number";

            rate.className =
                "service-rate";

            rate.min =
                "0";

            rate.value =
                service.rate || 0;


            /* AMOUNT */

            const amount =
                document.createElement(
                    "div"
                );

            amount.className =
                "service-amount";


            /* DELETE */

            const remove =
                document.createElement(
                    "button"
                );

            remove.type =
                "button";

            remove.className =
                "remove-service";

            remove.textContent =
                "×";


            row.appendChild(
                description
            );

            row.appendChild(
                qty
            );

            row.appendChild(
                rate
            );

            row.appendChild(
                amount
            );

            row.appendChild(
                remove
            );


            /* INITIAL AMOUNT */

            updateServiceAmount(
                row,
                index
            );


            /* =================================================
               DESCRIPTION

               NEVER REBUILD THE ROW HERE.
            ================================================= */

            description.addEventListener(
                "input",
                function () {

                    services[index]
                        .description =
                        this.value;

                    /*
                       Only update invoice preview.
                       Do NOT call renderServices().
                    */

                    updateInvoicePreview();

                }
            );


            /* =================================================
               QUANTITY
            ================================================= */

            qty.addEventListener(
                "input",
                function () {

                    services[index]
                        .qty =
                        Number(
                            this.value
                        ) || 0;

                    updateServiceAmount(
                        row,
                        index
                    );

                    updateInvoicePreview();

                }
            );


            /* =================================================
               RATE
            ================================================= */

            rate.addEventListener(
                "input",
                function () {

                    services[index]
                        .rate =
                        Number(
                            this.value
                        ) || 0;

                    updateServiceAmount(
                        row,
                        index
                    );

                    updateInvoicePreview();

                }
            );


            /* =================================================
               REMOVE
            ================================================= */

            remove.addEventListener(
                "click",
                function () {

                    removeService(
                        index
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   SERVICE AMOUNT
========================================================= */

function updateServiceAmount(
    row,
    index
) {

    if (!services[index]) {
        return;
    }

    const qty =
        Number(
            services[index].qty
        ) || 0;

    const rate =
        Number(
            services[index].rate
        ) || 0;

    const amount =
        qty * rate;

    const element =
        row.querySelector(
            ".service-amount"
        );

    if (element) {

        element.textContent =
            money(amount);

    }

}


/* =========================================================
   CALCULATIONS
========================================================= */

function calculateSubtotal() {

    return services.reduce(
        function (
            total,
            service
        ) {

            const qty =
                Number(
                    service.qty
                ) || 0;

            const rate =
                Number(
                    service.rate
                ) || 0;

            return (
                total +
                (
                    qty * rate
                )
            );

        },
        0
    );

}


function getDiscount() {

    const input =
        document.getElementById(
            "discount"
        );

    if (!input) {
        return 0;
    }

    return Math.max(
        0,
        Number(
            input.value
        ) || 0
    );

}


function calculateTotal() {

    return Math.max(
        0,
        calculateSubtotal() -
        getDiscount()
    );

}


function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );

}


/* =========================================================
   UPDATE EVERYTHING EXCEPT SERVICE INPUTS
========================================================= */

function updateAll() {

    updateInvoicePreview();

}


/* =========================================================
   UPDATE INVOICE PREVIEW
========================================================= */

function updateInvoicePreview() {

    const clientName =
        getValue(
            "clientName",
            "Client Name"
        );

    const company =
        getValue(
            "company",
            "Company / Business"
        );

    const phone =
        getValue(
            "phone",
            "+91 XXXXX XXXXX"
        );

    const location =
        getValue(
            "location",
            "Vijayawada, Andhra Pradesh"
        );

    const billNumber =
        getValue(
            "billNumber",
            "SPMW-0001"
        );

    const billDate =
        getValue(
            "billDate",
            ""
        );

    const dueDate =
        getValue(
            "dueDate",
            ""
        );

    const upi =
        getValue(
            "upi",
            "yourupi@upi"
        );

    const notes =
        getValue(
            "notes",
            "Thank you for choosing SP Media Works."
        );

    const terms =
        getValue(
            "terms",
            "Payment once made is non-refundable."
        );


    const subtotal =
        calculateSubtotal();

    const discount =
        getDiscount();

    const total =
        calculateTotal();


    /* CLIENT */

    setText(
        "previewClient",
        clientName
    );

    setText(
        "previewCompany",
        company
    );

    setText(
        "previewPhone",
        phone
    );

    setText(
        "previewLocation",
        location
    );


    /* BILL DETAILS */

    setText(
        "previewBillNumber",
        "#" + billNumber
    );

    setText(
        "previewDate",
        formatDate(
            billDate
        )
    );

    setText(
        "previewDueDate",
        formatDate(
            dueDate
        )
    );


    /* PAYMENT */

    setText(
        "previewUPI",
        upi
    );

    setText(
        "previewNotes",
        notes
    );

    setText(
        "previewTerms",
        terms
    );


    /* TOTALS */

    setText(
        "editorSubtotal",
        money(subtotal)
    );

    setText(
        "editorDiscount",
        "- " +
        money(discount)
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
        "- " +
        money(discount)
    );

    setText(
        "previewTotal",
        money(total)
    );


    /* QR */

    updateQRPreview();


    /* GENERATED TIME */

    setText(
        "generatedTime",
        "Generated on: " +
        formatDateTime(
            generatedAt
        )
    );


    /* INVOICE ITEMS */

    renderInvoiceItems();


    /* STATUS */

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

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";


    services.forEach(
        function (
            service,
            index
        ) {

            const qty =
                Number(
                    service.qty
                ) || 0;

            const rate =
                Number(
                    service.rate
                ) || 0;

            const amount =
                qty * rate;


            const row =
                document.createElement(
                    "tr"
                );


            const number =
                document.createElement(
                    "td"
                );

            number.textContent =
                String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                );


            const description =
                document.createElement(
                    "td"
                );

            description.textContent =
                service.description ||
                "Service description";


            const quantity =
                document.createElement(
                    "td"
                );

            quantity.textContent =
                qty;


            const rateCell =
                document.createElement(
                    "td"
                );

            rateCell.textContent =
                money(rate);


            const amountCell =
                document.createElement(
                    "td"
                );

            amountCell.textContent =
                money(amount);


            row.appendChild(
                number
            );

            row.appendChild(
                description
            );

            row.appendChild(
                quantity
            );

            row.appendChild(
                rateCell
            );

            row.appendChild(
                amountCell
            );


            tbody.appendChild(
                row
            );

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

    const paidButton =
        document.getElementById(
            "markPaidButton"
        );


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


    if (heading) {

        heading.textContent =
            billStatus === "PAID"
                ? "PAYMENT RECEIPT"
                : "PAYMENT BILL";

    }


    if (footer) {

        footer.className =
            billStatus === "PAID"
                ? "invoice-footer paid"
                : "invoice-footer";

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
                    This is a computer generated slip and does not require a signature.
                </span>

                <span id="generatedTime">
                    Generated on:
                    ${formatDateTime(generatedAt)}
                </span>

            </div>
        `;

    }


    if (paidButton) {

        paidButton.style.display =
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
        event.target.files &&
        event.target.files[0];

    if (!file) {
        return;
    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select a valid QR image."
        );

        event.target.value =
            "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            qrData =
                e.target.result;

            updateQRFileName(
                file.name
            );

            updateQRPreview();

        };


    reader.readAsDataURL(
        file
    );

}


function updateQRPreview() {

    const image =
        document.getElementById(
            "previewQR"
        );

    if (!image) {
        return;
    }

    const placeholder =
        image.parentElement
            ? image.parentElement.querySelector(
                "span"
            )
            : null;


    if (qrData) {

        image.src =
            qrData;

        image.style.display =
            "block";

        if (placeholder) {

            placeholder.style.display =
                "none";

        }

    } else {

        image.removeAttribute(
            "src"
        );

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

        input.value =
            "";

    }

    updateQRFileName();

    updateQRPreview();

}


function updateQRFileName(
    name = "No QR selected"
) {

    const label =
        document.getElementById(
            "qrFileName"
        );

    if (label) {

        label.textContent =
            name ||
            "No QR selected";

    }

}


/* =========================================================
   MARK PAID
========================================================= */

function markPaid() {

    billStatus =
        "PAID";

    /*
       Record the exact time payment was marked.
    */

    generatedAt =
        new Date().toISOString();

    updateInvoicePreview();

    saveBill(true);

}


/* =========================================================
   COLLECT BILL DATA
========================================================= */

function collectBillData() {

    return {

        id:
            currentBillId ||
            Date.now().toString(),

        billNumber:
            getValue(
                "billNumber",
                ""
            ),

        date:
            getValue(
                "billDate",
                ""
            ),

        dueDate:
            getValue(
                "dueDate",
                ""
            ),

        status:
            billStatus,

        generatedAt:
            generatedAt,

        client: {

            name:
                getValue(
                    "clientName",
                    ""
                ),

            company:
                getValue(
                    "company",
                    ""
                ),

            phone:
                getValue(
                    "phone",
                    ""
                ),

            email:
                getValue(
                    "email",
                    ""
                ),

            location:
                getValue(
                    "location",
                    ""
                )

        },


        services:
            services.map(
                function (service) {

                    return {

                        description:
                            service.description ||
                            "",

                        qty:
                            Number(
                                service.qty
                            ) || 0,

                        rate:
                            Number(
                                service.rate
                            ) || 0

                    };

                }
            ),


        discount:
            getDiscount(),


        upi:
            getValue(
                "upi",
                ""
            ),

        qrData:
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

function saveBill(
    silent = false
) {

    const bill =
        collectBillData();

    const bills =
        getBills();


    const existingIndex =
        bills.findIndex(
            function (item) {

                return (
                    item.id ===
                    bill.id
                );

            }
        );


    if (
        existingIndex !==
        -1
    ) {

        bills[
            existingIndex
        ] = bill;

    } else {

        bills.unshift(
            bill
        );

    }


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            bills
        )
    );


    currentBillId =
        bill.id;


    if (!silent) {

        alert(
            billStatus === "PAID"
                ? "Paid receipt saved successfully."
                : "Bill saved successfully."
        );

    }


    renderHistory();

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

        return [];

    }

}


/* =========================================================
   OPEN BILL
========================================================= */

function openBill(id) {

    const bills =
        getBills();


    const bill =
        bills.find(
            function (item) {

                return (
                    item.id === id
                );

            }
        );


    if (!bill) {

        alert(
            "Bill not found."
        );

        return;

    }


    currentBillId =
        bill.id;


    billStatus =
        bill.status ||
        "DUE";


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
        bill.notes ||
        "Thank you for choosing SP Media Works."
    );


    setValue(
        "terms",
        bill.terms ||
        "Payment once made is non-refundable.\nDelivery will begin after payment confirmation.\nAdditional revisions may be charged separately."
    );


    qrData =
        bill.qrData ||
        "";


    updateQRFileName(
        qrData
            ? "QR code saved"
            : "No QR selected"
    );


    services =
        Array.isArray(
            bill.services
        )
            ? bill.services.map(
                function (service) {

                    return {

                        description:
                            service.description ||
                            "",

                        qty:
                            Number(
                                service.qty
                            ) || 0,

                        rate:
                            Number(
                                service.rate
                            ) || 0

                    };

                }
            )
            : [];


    if (!services.length) {

        services.push({

            description: "",

            qty: 1,

            rate: 0

        });

    }


    /*
       Only here do we rebuild
       the service editor.
    */

    renderServices();

    updateAll();

    showPage(
        "create"
    );

}


/* =========================================================
   NEW BILL
========================================================= */

function newBill() {

    currentBillId =
        null;

    billStatus =
        "DUE";

    generatedAt =
        new Date().toISOString();


    setValue(
        "clientName",
        ""
    );

    setValue(
        "company",
        ""
    );

    setValue(
        "phone",
        ""
    );

    setValue(
        "email",
        ""
    );

    setValue(
        "location",
        ""
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
        "upi",
        ""
    );

    setValue(
        "paymentReference",
        ""
    );


    setValue(
        "notes",
        "Thank you for choosing SP Media Works."
    );


    setValue(
        "terms",
        "Payment once made is non-refundable.\nDelivery will begin after payment confirmation.\nAdditional revisions may be charged separately."
    );


    qrData =
        "";

    updateQRFileName();

    services =
        [];


    addService(
        true
    );

}


/* =========================================================
   DELETE BILL
========================================================= */

function deleteBill(id) {

    if (
        !confirm(
            "Are you sure you want to delete this bill?"
        )
    ) {
        return;
    }


    const bills =
        getBills().filter(
            function (bill) {

                return (
                    bill.id !== id
                );

            }
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            bills
        )
    );


    if (
        currentBillId === id
    ) {

        currentBillId =
            null;

    }


    renderHistory();

}


/* =========================================================
   PAGE NAVIGATION
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

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(
            function (button) {

                button.classList.remove(
                    "active"
                );

            }
        );


    if (
        page === "history"
    ) {

        if (createPage) {

            createPage.classList.add(
                "hidden"
            );

        }

        if (historyPage) {

            historyPage.classList.remove(
                "hidden"
            );

        }

        if (pageTitle) {

            pageTitle.textContent =
                "Bill History";

        }

        const buttons =
            document.querySelectorAll(
                ".nav-btn"
            );

        if (buttons[1]) {

            buttons[1].classList.add(
                "active"
            );

        }

        renderHistory();

    } else {

        if (historyPage) {

            historyPage.classList.add(
                "hidden"
            );

        }

        if (createPage) {

            createPage.classList.remove(
                "hidden"
            );

        }

        if (pageTitle) {

            pageTitle.textContent =
                "Create Bill";

        }

        const buttons =
            document.querySelectorAll(
                ".nav-btn"
            );

        if (buttons[0]) {

            buttons[0].classList.add(
                "active"
            );

        }

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

    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "searchBills"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const bills =
        getBills().filter(
            function (bill) {

                const number =
                    String(
                        bill.billNumber ||
                        ""
                    ).toLowerCase();

                const name =
                    String(
                        bill.client?.name ||
                        ""
                    ).toLowerCase();

                const company =
                    String(
                        bill.client?.company ||
                        ""
                    ).toLowerCase();


                return (
                    number.includes(
                        search
                    ) ||
                    name.includes(
                        search
                    ) ||
                    company.includes(
                        search
                    )
                );

            }
        );


    if (!bills.length) {

        container.innerHTML = `
            <div class="empty-history">
                No saved bills found.
            </div>
        `;

        return;

    }


    container.innerHTML =
        "";


    bills.forEach(
        function (bill) {

            const subtotal =
                (
                    bill.services ||
                    []
                ).reduce(
                    function (
                        sum,
                        item
                    ) {

                        return (
                            sum +
                            (
                                Number(
                                    item.qty
                                ) || 0
                            ) *
                            (
                                Number(
                                    item.rate
                                ) || 0
                            )
                        );

                    },
                    0
                );


            const total =
                Math.max(
                    0,
                    subtotal -
                    (
                        Number(
                            bill.discount
                        ) || 0
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
                    onclick="openBill('${bill.id}')"
                >
                    Open
                </button>


                <button
                    class="history-delete"
                    type="button"
                    onclick="deleteBill('${bill.id}')"
                >
                    ×
                </button>

            `;


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   PDF
========================================================= */

async function downloadPDF() {

    /*
       Update timestamp when PDF is generated.
    */

    generatedAt =
        new Date().toISOString();

    updateInvoicePreview();


    const invoice =
        document.getElementById(
            "invoice"
        );


    if (!invoice) {

        alert(
            "Invoice preview not found."
        );

        return;

    }


    try {

        await new Promise(
            function (resolve) {

                requestAnimationFrame(
                    resolve
                );

            }
        );


        const canvas =
            await html2canvas(
                invoice,
                {
                    scale: 2,
                    useCORS: true,
                    backgroundColor:
                        "#ffffff",
                    logging: false
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
                {
                    orientation:
                        "portrait",

                    unit:
                        "mm",

                    format:
                        "a4",

                    compress:
                        true
                }
            );


        pdf.addImage(
            image,
            "PNG",
            0,
            0,
            210,
            297,
            undefined,
            "FAST"
        );


        const billNumber =
            getValue(
                "billNumber",
                "SPMW-BILL"
            );


        const suffix =
            billStatus === "PAID"
                ? "PAID"
                : "PAYMENT-DUE";


        pdf.save(
            `${billNumber}-${suffix}.pdf`
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Could not generate PDF. Please try again."
        );

    }

}


/* =========================================================
   HELPERS
========================================================= */

function getValue(
    id,
    fallback = ""
) {

    const element =
        document.getElementById(
            id
        );

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
        document.getElementById(
            id
        );

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
        document.getElementById(
            id
        );

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function escapeHTML(
    value
) {

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
   COMPATIBILITY FUNCTION
   HTML INPUTS USE updatePreview()
========================================================= */

function updatePreview() {
    updateInvoicePreview();
}
