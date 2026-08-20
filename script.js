/* =========================================================
   SP MEDIA WORKS — BILL GENERATOR
   Plain HTML + CSS + JavaScript
========================================================= */

const STORAGE_KEY = "sp_media_works_bills";

let services = [];
let currentBillId = null;
let billStatus = "DUE";


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeBill();
    services = [];
    addService();
    updatePreview();
});


/* =========================================================
   INITIAL BILL
========================================================= */

function initializeBill() {
    const billNumber = document.getElementById("billNumber");
    const billDate = document.getElementById("billDate");

    if (billNumber) {
        billNumber.value = generateBillNumber();
    }

    if (billDate) {
        billDate.value = getToday();
    }
}


/* =========================================================
   DATE
========================================================= */

function getToday() {
    const date = new Date();

    return date.toISOString().split("T")[0];
}


function formatDate(date) {
    if (!date) return "—";

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =========================================================
   BILL NUMBER
========================================================= */

function generateBillNumber() {
    const bills = getBills();

    let maxNumber = 0;

    bills.forEach(bill => {
        const match = String(bill.billNumber || "").match(/(\d+)$/);

        if (match) {
            maxNumber = Math.max(
                maxNumber,
                Number(match[1])
            );
        }
    });

    return "SPMW-" + String(maxNumber + 1).padStart(4, "0");
}


/* =========================================================
   ADD SERVICE
========================================================= */

function addService(description = "", qty = 1, rate = 0) {

    services.push({
        description: description,
        qty: qty,
        rate: rate
    });

    /*
       IMPORTANT:
       renderServices() is called ONLY when a row
       is actually added.

       It is NOT called while typing.
    */

    renderServices();

    updatePreview();


    /*
       Automatically focus the newly added
       service description field.
    */

    setTimeout(() => {

        const inputs =
            document.querySelectorAll(
                ".service-description"
            );

        if (inputs.length > 0) {

            const lastInput =
                inputs[inputs.length - 1];

            lastInput.focus();

            /*
               Put cursor at the end.
            */

            lastInput.setSelectionRange(
                lastInput.value.length,
                lastInput.value.length
            );
        }

    }, 0);
}


/* =========================================================
   REMOVE SERVICE
========================================================= */

function removeService(index) {

    if (services.length <= 1) {

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


/* =========================================================
   RENDER SERVICE ROWS
========================================================= */

function renderServices() {

    const list =
        document.getElementById("serviceList");

    if (!list) return;


    /*
       This function completely creates the rows.

       NEVER call this function from an input event.
    */

    list.innerHTML = "";


    services.forEach((service, index) => {

        const row =
            document.createElement("div");

        row.className = "service-row";


        /* -----------------------------------------
           DESCRIPTION
        ----------------------------------------- */

        const description =
            document.createElement("input");

        description.type = "text";

        description.className =
            "service-description";

        description.placeholder =
            "Service / description";

        description.value =
            service.description || "";


        /* -----------------------------------------
           QUANTITY
        ----------------------------------------- */

        const qty =
            document.createElement("input");

        qty.type = "number";

        qty.className =
            "service-qty";

        qty.min = "1";

        qty.value =
            service.qty ?? 1;


        /* -----------------------------------------
           RATE
        ----------------------------------------- */

        const rate =
            document.createElement("input");

        rate.type = "number";

        rate.className =
            "service-rate";

        rate.min = "0";

        rate.value =
            service.rate ?? 0;


        /* -----------------------------------------
           AMOUNT
        ----------------------------------------- */

        const amount =
            document.createElement("div");

        amount.className =
            "service-amount";


        /* -----------------------------------------
           REMOVE BUTTON
        ----------------------------------------- */

        const remove =
            document.createElement("button");

        remove.type = "button";

        remove.className =
            "remove-service";

        remove.textContent = "×";


        /* -----------------------------------------
           PUT EVERYTHING INTO ROW
        ----------------------------------------- */

        row.appendChild(description);
        row.appendChild(qty);
        row.appendChild(rate);
        row.appendChild(amount);
        row.appendChild(remove);


        /* -----------------------------------------
           INITIAL AMOUNT
        ----------------------------------------- */

        updateServiceAmount(
            row,
            index
        );


        /* =================================================
           DESCRIPTION INPUT

           THIS IS THE IMPORTANT FIX.

           We only update the data.

           We DO NOT render the rows again.
        ================================================= */

        description.addEventListener(
            "input",
            function () {

                services[index].description =
                    this.value;

                updatePreview();

            }
        );


        /* -----------------------------------------
           QUANTITY INPUT
        ----------------------------------------- */

        qty.addEventListener(
            "input",
            function () {

                services[index].qty =
                    Number(this.value) || 0;


                updateServiceAmount(
                    row,
                    index
                );


                updatePreview();

            }
        );


        /* -----------------------------------------
           RATE INPUT
        ----------------------------------------- */

        rate.addEventListener(
            "input",
            function () {

                services[index].rate =
                    Number(this.value) || 0;


                updateServiceAmount(
                    row,
                    index
                );


                updatePreview();

            }
        );


        /* -----------------------------------------
           REMOVE
        ----------------------------------------- */

        remove.addEventListener(
            "click",
            function () {

                removeService(index);

            }
        );


        list.appendChild(row);

    });
}


/* =========================================================
   UPDATE SERVICE AMOUNT
========================================================= */

function updateServiceAmount(row, index) {

    if (!services[index]) return;

    const qty =
        Number(services[index].qty) || 0;

    const rate =
        Number(services[index].rate) || 0;

    const amount =
        qty * rate;


    const amountElement =
        row.querySelector(".service-amount");


    if (amountElement) {

        amountElement.textContent =
            money(amount);

    }
}


/* =========================================================
   SUBTOTAL
========================================================= */

function calculateSubtotal() {

    return services.reduce(
        (total, service) => {

            const qty =
                Number(service.qty) || 0;

            const rate =
                Number(service.rate) || 0;

            return total + (qty * rate);

        },
        0
    );
}


/* =========================================================
   DISCOUNT
========================================================= */

function getDiscount() {

    const discountInput =
        document.getElementById("discount");

    if (!discountInput) return 0;

    return Math.max(
        0,
        Number(discountInput.value) || 0
    );
}


/* =========================================================
   TOTAL
========================================================= */

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
   MONEY FORMAT
========================================================= */

function money(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(amount) || 0
    );
}


/* =========================================================
   UPDATE PREVIEW
========================================================= */

function updatePreview() {

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


    const subtotal =
        calculateSubtotal();

    const discount =
        getDiscount();

    const total =
        calculateTotal();


    /* -----------------------------------------
       CLIENT
    ----------------------------------------- */

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


    /* -----------------------------------------
       BILL DETAILS
    ----------------------------------------- */

    setText(
        "previewBillNumber",
        "#" + billNumber
    );

    setText(
        "previewDate",
        formatDate(billDate)
    );

    setText(
        "previewDueDate",
        formatDate(dueDate)
    );


    /* -----------------------------------------
       PAYMENT
    ----------------------------------------- */

    setText(
        "previewUPI",
        upi
    );

    setText(
        "previewNotes",
        notes
    );


    /* -----------------------------------------
       EDITOR TOTALS
    ----------------------------------------- */

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


    /* -----------------------------------------
       INVOICE TOTALS
    ----------------------------------------- */

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


    renderInvoiceItems();

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

            const qty =
                Number(service.qty) || 0;

            const rate =
                Number(service.rate) || 0;

            const amount =
                qty * rate;


            const row =
                document.createElement("tr");


            const numberCell =
                document.createElement("td");

            numberCell.textContent =
                String(index + 1)
                    .padStart(2, "0");


            const descriptionCell =
                document.createElement("td");

            const strong =
                document.createElement("strong");

            strong.textContent =
                service.description ||
                "Service description";

            descriptionCell.appendChild(
                strong
            );


            const qtyCell =
                document.createElement("td");

            qtyCell.textContent =
                qty;


            const rateCell =
                document.createElement("td");

            rateCell.textContent =
                money(rate);


            const amountCell =
                document.createElement("td");

            amountCell.textContent =
                money(amount);


            row.appendChild(numberCell);
            row.appendChild(descriptionCell);
            row.appendChild(qtyCell);
            row.appendChild(rateCell);
            row.appendChild(amountCell);


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

    const paidButton =
        document.getElementById(
            "markPaidButton"
        );


    if (!status) return;


    if (billStatus === "PAID") {

        status.textContent =
            "PAID";

        status.className =
            "status paid";


        if (heading) {

            heading.textContent =
                "PAYMENT RECEIPT";

        }


        if (footer) {

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

        }


        if (paidButton) {

            paidButton.style.display =
                "none";

        }

    } else {

        status.textContent =
            "PAYMENT DUE";

        status.className =
            "status due";


        if (heading) {

            heading.textContent =
                "PAYMENT BILL";

        }


        if (footer) {

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

        }


        if (paidButton) {

            paidButton.style.display =
                "inline-flex";

        }
    }
}


/* =========================================================
   MARK PAID
========================================================= */

function markPaid() {

    billStatus = "PAID";

    saveBill(true);

    updatePreview();

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
            getValue("billNumber", ""),


        date:
            getValue("billDate", ""),


        dueDate:
            getValue("dueDate", ""),


        status:
            billStatus,


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


        paymentReference:
            getValue(
                "paymentReference",
                ""
            ),


        notes:
            getValue("notes", "")

    };
}


/* =========================================================
   SAVE BILL
========================================================= */

function saveBill(silent = false) {

    const bill =
        collectBillData();

    const bills =
        getBills();


    if (currentBillId) {

        const index =
            bills.findIndex(
                billItem =>
                    billItem.id ===
                    currentBillId
            );


        if (index !== -1) {

            bills[index] =
                bill;

        } else {

            bills.unshift(
                bill
            );

        }

    } else {

        bills.unshift(
            bill
        );

    }


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bills)
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
            item =>
                item.id === id
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


    services =
        Array.isArray(
            bill.services
        )
            ? bill.services.map(
                service => ({

                    description:
                        service.description || "",

                    qty:
                        Number(
                            service.qty
                        ) || 0,

                    rate:
                        Number(
                            service.rate
                        ) || 0

                })
            )
            : [];


    if (services.length === 0) {

        services.push({
            description: "",
            qty: 1,
            rate: 0
        });

    }


    renderServices();

    updatePreview();

    showPage("create");
}


/* =========================================================
   DELETE BILL
========================================================= */

function deleteBill(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this bill?"
        );


    if (!confirmed) return;


    const bills =
        getBills().filter(
            bill =>
                bill.id !== id
        );


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(bills)
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

    currentBillId =
        null;

    billStatus =
        "DUE";


    setValue("clientName", "");
    setValue("company", "");
    setValue("phone", "");
    setValue("email", "");
    setValue("location", "");

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


    services = [];


    /*
       addService() will render ONE row
       and automatically focus it.
    */

    addService();

    updatePreview();

    showPage("create");
}


/* =========================================================
   SHOW PAGE
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

    const navButtons =
        document.querySelectorAll(
            ".nav-btn"
        );


    navButtons.forEach(
        button =>
            button.classList.remove(
                "active"
            )
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


        if (navButtons[1]) {

            navButtons[1]
                .classList.add(
                    "active"
                );

        }


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


        if (navButtons[0]) {

            navButtons[0]
                .classList.add(
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

    if (!container) return;


    const searchInput =
        document.getElementById(
            "searchBills"
        );


    const search =
        (
            searchInput
                ? searchInput.value
                : ""
        )
        .trim()
        .toLowerCase();


    const bills =
        getBills().filter(
            bill => {

                const number =
                    String(
                        bill.billNumber || ""
                    ).toLowerCase();

                const name =
                    String(
                        bill.client?.name || ""
                    ).toLowerCase();

                const company =
                    String(
                        bill.client?.company || ""
                    ).toLowerCase();


                return (
                    number.includes(search) ||
                    name.includes(search) ||
                    company.includes(search)
                );

            }
        );


    if (bills.length === 0) {

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
            (bill.services || [])
                .reduce(
                    (sum, item) => {

                        return sum +
                            (
                                Number(item.qty) || 0
                            ) *
                            (
                                Number(item.rate) || 0
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


        const clientName =
            bill.client?.name ||
            "Unnamed client";


        row.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(
                        bill.billNumber || ""
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        clientName
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

    });
}


/* =========================================================
   PDF
========================================================= */

async function downloadPDF() {

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

        /*
           Make sure the browser has finished
           rendering before taking screenshot.
        */

        await new Promise(
            resolve =>
                requestAnimationFrame(
                    resolve
                )
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


        /*
           TRUE A4
        */

        const pdf =
            new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true
            });


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


        const status =
            billStatus === "PAID"
                ? "PAID"
                : "PAYMENT-DUE";


        pdf.save(
            `${billNumber}-${status}.pdf`
        );


    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );


        alert(
            "Could not generate PDF. Please try again."
        );

    }
}


/* =========================================================
   HELPER — GET VALUE
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


    return element.value || fallback;
}


/* =========================================================
   HELPER — SET VALUE
========================================================= */

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


/* =========================================================
   HELPER — SET TEXT
========================================================= */

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


/* =========================================================
   HELPER — ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
