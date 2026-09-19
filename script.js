/* ==================================================
   10 STUDY HUB
   Flash Cards + Images + PDFs + Study Mode
================================================== */


/* ==================================================
   DATABASE
================================================== */

const DB_NAME = "StudyCardsDatabase";
const DB_VERSION = 2;

let db;

let flashcards = [];
let pdfs = [];

let editingCardId = null;
let selectedImage = null;

let studyCards = [];
let studyIndex = 0;


/* ==================================================
   HELPERS
================================================== */

const $ = (selector) =>
    document.querySelector(selector);


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatFileSize(bytes) {

    if (bytes < 1024)
        return bytes + " B";

    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}


/* ==================================================
   INDEXED DB
================================================== */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);


        request.onupgradeneeded = function (event) {

            const database = event.target.result;


            if (!database.objectStoreNames.contains("flashcards")) {

                database.createObjectStore(
                    "flashcards",
                    {
                        keyPath: "id"
                    }
                );
            }


            if (!database.objectStoreNames.contains("pdfs")) {

                database.createObjectStore(
                    "pdfs",
                    {
                        keyPath: "id"
                    }
                );
            }
        };


        request.onsuccess = function () {

            db = request.result;

            resolve(db);
        };


        request.onerror = function () {

            reject(request.error);
        };
    });
}


function getAll(storeName) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );

        const store =
            transaction.objectStore(storeName);

        const request =
            store.getAll();


        request.onsuccess = () => {

            resolve(request.result);
        };


        request.onerror = () => {

            reject(request.error);
        };
    });
}


function addItem(storeName, item) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(storeName);

        const request =
            store.add(item);


        request.onsuccess = () =>
            resolve(item);


        request.onerror = () =>
            reject(request.error);
    });
}


function putItem(storeName, item) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(storeName);

        const request =
            store.put(item);


        request.onsuccess = () =>
            resolve(item);


        request.onerror = () =>
            reject(request.error);
    });
}


function deleteItem(storeName, id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );

        const store =
            transaction.objectStore(storeName);

        const request =
            store.delete(id);


        request.onsuccess = () =>
            resolve();


        request.onerror = () =>
            reject(request.error);
    });
}


/* ==================================================
   TABS
================================================== */

document.querySelectorAll(".tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".tab")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                document
                    .querySelectorAll(".tab-content")
                    .forEach(section =>
                        section.classList.remove("active")
                    );


                tab.classList.add("active");


                const target =
                    document.getElementById(
                        tab.dataset.tab
                    );


                if (target) {
                    target.classList.add("active");
                }
            }
        );

    });


/* ==================================================
   FLASHCARD MODAL
================================================== */

const cardModal =
    $("#cardModal");

const addCardBtn =
    $("#addCardBtn");

const closeModalBtn =
    $("#closeModalBtn");

const saveCardBtn =
    $("#saveCardBtn");

const modalTitle =
    $("#modalTitle");

const questionInput =
    $("#questionInput");

const answerInput =
    $("#answerInput");


function resetImageInput() {

    selectedImage = null;

    const input =
        $("#imageInput");

    const preview =
        $("#imagePreview");

    const previewImage =
        $("#previewImage");

    const uploadText =
        $("#imageUploadText");


    if (input)
        input.value = "";

    if (preview)
        preview.classList.add("hidden");

    if (previewImage)
        previewImage.src = "";

    if (uploadText)
        uploadText.textContent =
            "Click to upload a photo";
}


function openAddModal() {

    editingCardId = null;

    modalTitle.textContent =
        "Add Flash Card";

    questionInput.value = "";

    answerInput.value = "";

    resetImageInput();

    cardModal.classList.remove("hidden");

    questionInput.focus();
}


function closeCardModal() {

    cardModal.classList.add("hidden");

    editingCardId = null;

    resetImageInput();
}


addCardBtn.addEventListener(
    "click",
    openAddModal
);


closeModalBtn.addEventListener(
    "click",
    closeCardModal
);


document
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closeCardModal
    );


/* ==================================================
   IMAGE UPLOAD
================================================== */

const imageInput =
    $("#imageInput");

const imagePreview =
    $("#imagePreview");

const previewImage =
    $("#previewImage");

const imageUploadText =
    $("#imageUploadText");

const removeImageBtn =
    $("#removeImageBtn");


imageInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        if (!file)
            return;


        if (!file.type.startsWith("image/")) {

            alert(
                "Please select an image file."
            );

            this.value = "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                selectedImage =
                    event.target.result;


                previewImage.src =
                    selectedImage;


                imagePreview
                    .classList
                    .remove("hidden");


                imageUploadText.textContent =
                    file.name;
            };


        reader.readAsDataURL(file);
    }
);


removeImageBtn.addEventListener(
    "click",
    function () {

        selectedImage = null;

        imageInput.value = "";

        imagePreview
            .classList
            .add("hidden");

        previewImage.src = "";

        imageUploadText.textContent =
            "Click to upload a photo";
    }
);


/* ==================================================
   SAVE FLASHCARD
================================================== */

saveCardBtn.addEventListener(
    "click",
    async function () {

        const question =
            questionInput.value.trim();

        const answer =
            answerInput.value.trim();


        if (!question) {

            alert(
                "Please enter a question."
            );

            questionInput.focus();

            return;
        }


        if (!answer) {

            alert(
                "Please enter an answer."
            );

            answerInput.focus();

            return;
        }


        const card = {

            id:
                editingCardId ||
                Date.now(),

            question,

            answer,

            image:
                selectedImage || null
        };


        try {

            if (editingCardId) {

                await putItem(
                    "flashcards",
                    card
                );

            } else {

                await addItem(
                    "flashcards",
                    card
                );
            }


            await loadFlashcards();

            closeCardModal();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to save the flash card."
            );
        }
    }
);


/* ==================================================
   LOAD FLASHCARDS
================================================== */

async function loadFlashcards() {

    flashcards =
        await getAll("flashcards");


    flashcards.sort(
        (a, b) => b.id - a.id
    );


    renderFlashcards();

    prepareStudyMode();
}


/* ==================================================
   RENDER FLASHCARDS
================================================== */

function renderFlashcards() {

    const container =
        $("#flashcardsContainer");

    const empty =
        $("#flashcardsEmpty");


    container.innerHTML = "";


    if (flashcards.length === 0) {

        empty.classList.remove("hidden");

        return;
    }


    empty.classList.add("hidden");


    flashcards.forEach(card => {

        const element =
            document.createElement("div");


        element.className =
            "flashcard";


        element.innerHTML = `

            ${
                card.image
                    ? `
                        <img
                            src="${card.image}"
                            class="flashcard-image"
                            alt="Flashcard image">
                      `
                    : ""
            }

            <h3>
                ${escapeHTML(card.question)}
            </h3>

            <div class="answer-preview">
                ${escapeHTML(card.answer)}
            </div>

            <div class="actions">

                <button
                    class="secondary edit">

                    Edit

                </button>

                <button
                    class="secondary delete">

                    Delete

                </button>

            </div>
        `;


        element
            .querySelector(".edit")
            .addEventListener(
                "click",
                () => editCard(card.id)
            );


        element
            .querySelector(".delete")
            .addEventListener(
                "click",
                () => deleteCard(card.id)
            );


        container.appendChild(element);
    });
}


/* ==================================================
   EDIT FLASHCARD
================================================== */

function editCard(id) {

    const card =
        flashcards.find(
            item => item.id === id
        );


    if (!card)
        return;


    editingCardId =
        card.id;


    modalTitle.textContent =
        "Edit Flash Card";


    questionInput.value =
        card.question;


    answerInput.value =
        card.answer;


    selectedImage =
        card.image || null;


    if (card.image) {

        previewImage.src =
            card.image;

        imagePreview
            .classList
            .remove("hidden");

        imageUploadText.textContent =
            "Current photo";
    } else {

        resetImageInput();
    }


    cardModal.classList.remove("hidden");

    questionInput.focus();
}


/* ==================================================
   DELETE FLASHCARD
================================================== */

async function deleteCard(id) {

    const confirmed =
        confirm(
            "Delete this flash card?"
        );


    if (!confirmed)
        return;


    try {

        await deleteItem(
            "flashcards",
            id
        );

        await loadFlashcards();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to delete the flash card."
        );
    }
}


/* ==================================================
   PDF
================================================== */

const pdfInput =
    $("#pdfInput");


pdfInput.addEventListener(
    "change",
    async function () {

        const file =
            this.files[0];


        if (!file)
            return;


        if (
            file.type !==
            "application/pdf"
        ) {

            alert(
                "Please select a PDF file."
            );

            this.value = "";

            return;
        }


        try {

            const buffer =
                await file.arrayBuffer();


            const pdf = {

                id: Date.now(),

                name: file.name,

                size: file.size,

                type: file.type,

                data: buffer
            };


            await addItem(
                "pdfs",
                pdf
            );


            await loadPDFs();


            this.value = "";

        } catch (error) {

            console.error(error);

            alert(
                "Unable to save the PDF."
            );
        }
    }
);


/* ==================================================
   LOAD PDFS
================================================== */

async function loadPDFs() {

    pdfs =
        await getAll("pdfs");


    pdfs.sort(
        (a, b) => b.id - a.id
    );


    renderPDFs();
}


/* ==================================================
   RENDER PDFS
================================================== */

function renderPDFs() {

    const container =
        $("#pdfContainer");

    const empty =
        $("#pdfEmpty");


    container.innerHTML = "";


    if (pdfs.length === 0) {

        empty.classList.remove("hidden");

        return;
    }


    empty.classList.add("hidden");


    pdfs.forEach(pdf => {

        const element =
            document.createElement("div");


        element.className =
            "pdf-card";


        element.innerHTML = `

            <div class="pdf-name">

                📄
                ${escapeHTML(pdf.name)}

            </div>

            <div>
                ${formatFileSize(pdf.size)}
            </div>

            <div class="pdf-actions">

                <button
                    class="primary open">

                    Open

                </button>

                <button
                    class="secondary delete">

                    Delete

                </button>

            </div>
        `;


        element
            .querySelector(".open")
            .addEventListener(
                "click",
                () => openPDF(pdf)
            );


        element
            .querySelector(".delete")
            .addEventListener(
                "click",
                () => deletePDF(pdf.id)
            );


        container.appendChild(element);
    });
}


/* ==================================================
   OPEN PDF
================================================== */

function openPDF(pdf) {

    const blob =
        new Blob(
            [pdf.data],
            {
                type:
                    "application/pdf"
            }
        );


    const url =
        URL.createObjectURL(blob);


    window.open(
        url,
        "_blank"
    );


    setTimeout(
        () => URL.revokeObjectURL(url),
        60000
    );
}


/* ==================================================
   DELETE PDF
================================================== */

async function deletePDF(id) {

    const confirmed =
        confirm(
            "Delete this PDF?"
        );


    if (!confirmed)
        return;


    await deleteItem(
        "pdfs",
        id
    );


    await loadPDFs();
}


/* ==================================================
   STUDY MODE
================================================== */

const cardType =
    $("#cardType");

const shuffleBtn =
    $("#shuffleBtn");

const studyEmpty =
    $("#studyEmpty");

const studyArea =
    $("#studyArea");

const studyCounter =
    $("#studyCounter");

const studyLabel =
    $("#studyLabel");

const studyQuestion =
    $("#studyQuestion");

const studyAnswer =
    $("#studyAnswer");

const studyImageContainer =
    $("#studyImageContainer");

const choices =
    $("#choices");

const showAnswerBtn =
    $("#showAnswerBtn");

const prevBtn =
    $("#prevBtn");

const nextBtn =
    $("#nextBtn");


function prepareStudyMode() {

    studyCards =
        [...flashcards];


    studyIndex = 0;


    if (studyCards.length === 0) {

        studyEmpty
            .classList
            .remove("hidden");

        studyArea
            .classList
            .add("hidden");

        return;
    }


    studyEmpty
        .classList
        .add("hidden");


    studyArea
        .classList
        .remove("hidden");


    showStudyCard();
}


/* ==================================================
   SHOW STUDY CARD
================================================== */

function showStudyCard() {

    if (studyCards.length === 0)
        return;


    const card =
        studyCards[studyIndex];


    const type =
        cardType.value;


    studyCounter.textContent =
        `Card ${studyIndex + 1} of ${studyCards.length}`;


    choices.innerHTML = "";


    studyAnswer
        .classList
        .add("hidden");


    studyAnswer.textContent =
        "";


    showAnswerBtn
        .classList
        .remove("hidden");


    studyImageContainer
        .innerHTML = "";


    if (
        card.image &&
        type !== "reverse"
    ) {

        const image =
            document.createElement("img");


        image.src =
            card.image;


        image.className =
            "study-question-image";


        image.alt =
            "Flashcard image";


        studyImageContainer
            .appendChild(image);
    }


    if (type === "reverse") {

        studyLabel.textContent =
            "Answer";


        studyQuestion.textContent =
            card.answer;


        studyAnswer.textContent =
            card.question;


    } else {

        studyLabel.textContent =
            "Question";


        studyQuestion.textContent =
            card.question;


        studyAnswer.textContent =
            card.answer;
    }


    if (type === "multiple") {

        showAnswerBtn
            .classList
            .add("hidden");

        createMultipleChoice(card);

    }


    if (type === "truefalse") {

        showAnswerBtn
            .classList
            .add("hidden");

        createTrueFalse(card);
    }
}


/* ==================================================
   SHOW ANSWER
================================================== */

showAnswerBtn.addEventListener(
    "click",
    () => {

        studyAnswer
            .classList
            .toggle("hidden");
    }
);


/* ==================================================
   MULTIPLE CHOICE
================================================== */

function createMultipleChoice(card) {

    const correct =
        card.answer;


    const others =
        flashcards
            .filter(
                item =>
                    item.id !== card.id
            )
            .map(
                item =>
                    item.answer
            )
            .filter(Boolean);


    const shuffledOthers =
        shuffleArray(
            others
        ).slice(0, 3);


    const options =
        shuffleArray([
            correct,
            ...shuffledOthers
        ]);


    options.forEach(option => {

        const button =
            document.createElement("button");


        button.className =
            "choice";


        button.textContent =
            option;


        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".choice")
                    .forEach(item => {

                        item.disabled = true;

                    });


                if (
                    option === correct
                ) {

                    button.classList
                        .add("correct");

                } else {

                    button.classList
                        .add("wrong");


                    document
                        .querySelectorAll(".choice")
                        .forEach(item => {

                            if (
                                item.textContent ===
                                correct
                            ) {

                                item.classList
                                    .add("correct");
                            }
                        });
                }
            }
        );


        choices.appendChild(button);
    });
}


/* ==================================================
   TRUE OR FALSE
================================================== */

function createTrueFalse(card) {

    const statements = [

        {
            text:
                card.question +
                " — " +
                card.answer,

            correct: true
        },

        {
            text:
                card.question +
                " — " +
                getWrongAnswer(card),

            correct: false
        }

    ];


    shuffleArray(
        statements
    ).forEach(statement => {

        const button =
            document.createElement("button");


        button.className =
            "choice";


        button.textContent =
            statement.correct
                ? "TRUE"
                : "FALSE";


        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".choice")
                    .forEach(item =>
                        item.disabled = true
                    );


                if (
                    statement.correct
                ) {

                    button.classList
                        .add("correct");

                } else {

                    button.classList
                        .add("wrong");
                }
            }
        );


        choices.appendChild(button);
    });


    studyQuestion.textContent =
        card.question;
}


/* ==================================================
   WRONG ANSWER HELPER
================================================== */

function getWrongAnswer(card) {

    const other =
        flashcards.find(
            item =>
                item.id !== card.id
        );


    if (other) {
        return other.answer;
    }


    return "None of the above";
}


/* ==================================================
   SHUFFLE
================================================== */

function shuffleArray(array) {

    const result =
        [...array];


    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }


    return result;
}


shuffleBtn.addEventListener(
    "click",
    () => {

        studyCards =
            shuffleArray(
                flashcards
            );


        studyIndex = 0;

        showStudyCard();
    }
);


/* ==================================================
   CARD TYPE CHANGE
================================================== */

cardType.addEventListener(
    "change",
    () => {

        studyIndex = 0;

        showStudyCard();
    }
);


/* ==================================================
   PREVIOUS / NEXT
================================================== */

prevBtn.addEventListener(
    "click",
    () => {

        if (studyCards.length === 0)
            return;


        studyIndex--;

        if (studyIndex < 0) {

            studyIndex =
                studyCards.length - 1;
        }


        showStudyCard();
    }
);


nextBtn.addEventListener(
    "click",
    () => {

        if (studyCards.length === 0)
            return;


        studyIndex++;


        if (
            studyIndex >=
            studyCards.length
        ) {

            studyIndex = 0;
        }


        showStudyCard();
    }
);


/* ==================================================
   START APPLICATION
================================================== */

async function startApp() {

    try {

        await openDatabase();

        await loadFlashcards();

        await loadPDFs();

    } catch (error) {

        console.error(
            "Application startup error:",
            error
        );

        alert(
            "There was a problem loading your saved data."
        );
    }
}


/* ==================================================
   SERVICE WORKER
================================================== */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .catch(
                    error =>
                        console.log(
                            "Service worker error:",
                            error
                        )
                );
        }
    );
}


/* ==================================================
   RUN
================================================== */

startApp();
