// ======================================================
// STUDY CARDS APP
// ======================================================

const DB_NAME = "StudyCardsDatabase";
const DB_VERSION = 1;

let db;
let editingId = null;

let studyCards = [];
let studyIndex = 0;


// ======================================================
// DATABASE
// ======================================================

function openDatabase() {

  return new Promise((resolve, reject) => {

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );


    request.onupgradeneeded = function(event) {

      const database = event.target.result;


      // Flashcards storage
      if (!database.objectStoreNames.contains("flashcards")) {

        database.createObjectStore(
          "flashcards",
          {
            keyPath: "id",
            autoIncrement: true
          }
        );

      }


      // PDF storage
      if (!database.objectStoreNames.contains("pdfs")) {

        database.createObjectStore(
          "pdfs",
          {
            keyPath: "id",
            autoIncrement: true
          }
        );

      }

    };


    request.onsuccess = function() {

      db = request.result;

      resolve(db);

    };


    request.onerror = function() {

      reject(request.error);

    };

  });

}


// ======================================================
// DATABASE HELPERS
// ======================================================

function getStore(
  storeName,
  mode = "readonly"
) {

  return db
    .transaction(storeName, mode)
    .objectStore(storeName);

}


function getAll(storeName) {

  return new Promise((resolve, reject) => {

    const request =
      getStore(storeName).getAll();


    request.onsuccess = function() {

      resolve(request.result);

    };


    request.onerror = function() {

      reject(request.error);

    };

  });

}


function addItem(
  storeName,
  item
) {

  return new Promise((resolve, reject) => {

    const request =
      getStore(
        storeName,
        "readwrite"
      ).add(item);


    request.onsuccess = function() {

      resolve(request.result);

    };


    request.onerror = function() {

      reject(request.error);

    };

  });

}


function putItem(
  storeName,
  item
) {

  return new Promise((resolve, reject) => {

    const request =
      getStore(
        storeName,
        "readwrite"
      ).put(item);


    request.onsuccess = function() {

      resolve(request.result);

    };


    request.onerror = function() {

      reject(request.error);

    };

  });

}


function deleteItem(
  storeName,
  id
) {

  return new Promise((resolve, reject) => {

    const request =
      getStore(
        storeName,
        "readwrite"
      ).delete(id);


    request.onsuccess = function() {

      resolve();

    };


    request.onerror = function() {

      reject(request.error);

    };

  });

}


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function $(id) {

  return document.getElementById(id);

}


function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function formatFileSize(bytes) {

  if (bytes < 1024) {

    return bytes + " B";

  }


  if (bytes < 1024 * 1024) {

    return (
      bytes / 1024
    ).toFixed(1) + " KB";

  }


  return (
    bytes /
    (1024 * 1024)
  ).toFixed(1) + " MB";

}


// ======================================================
// TABS
// ======================================================

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      function() {

        document
          .querySelectorAll(".tab")
          .forEach(tab => {

            tab.classList.remove(
              "active"
            );

          });


        document
          .querySelectorAll(".tab-content")
          .forEach(section => {

            section.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        $(
          button.dataset.tab
        ).classList.add(
          "active"
        );


        if (
          button.dataset.tab ===
          "studyTab"
        ) {

          loadStudyCards();

        }

      }
    );

  });


// ======================================================
// FLASHCARDS
// ======================================================

$("addCardBtn")
  .addEventListener(
    "click",
    function() {

      editingId = null;

      $("modalTitle")
        .textContent =
        "Add Flash Card";

      $("questionInput")
        .value = "";

      $("answerInput")
        .value = "";

      $("cardModal")
        .classList.remove(
          "hidden"
        );

    }
  );


$("closeModalBtn")
  .addEventListener(
    "click",
    closeModal
  );


$("cardModal")
  .addEventListener(
    "click",
    function(event) {

      if (
        event.target ===
        $("cardModal")
      ) {

        closeModal();

      }

    }
  );


function closeModal() {

  $("cardModal")
    .classList.add(
      "hidden"
    );

}


// ======================================================
// SAVE FLASHCARD
// ======================================================

$("saveCardBtn")
  .addEventListener(
    "click",
    async function() {

      const question =
        $("questionInput")
          .value
          .trim();


      const answer =
        $("answerInput")
          .value
          .trim();


      if (!question || !answer) {

        alert(
          "Please enter both a question and an answer."
        );

        return;

      }


      if (editingId === null) {

        await addItem(
          "flashcards",
          {
            question,
            answer
          }
        );

      } else {

        await putItem(
          "flashcards",
          {
            id: editingId,
            question,
            answer
          }
        );

      }


      closeModal();

      await loadFlashcards();

      await loadStudyCards();

    }
  );


// ======================================================
// DISPLAY FLASHCARDS
// ======================================================

async function loadFlashcards() {

  const cards =
    await getAll(
      "flashcards"
    );


  const container =
    $("flashcardsContainer");


  container.innerHTML = "";


  $("flashcardsEmpty")
    .classList.toggle(
      "hidden",
      cards.length > 0
    );


  cards.forEach(card => {

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "flashcard";


    div.innerHTML = `

      <h3>
        ${escapeHTML(card.question)}
      </h3>

      <div class="answer-preview">
        ${escapeHTML(card.answer)}
      </div>

      <div class="actions">

        <button class="secondary edit">
          Edit
        </button>

        <button class="secondary delete">
          Delete
        </button>

      </div>

    `;


    // EDIT
    div
      .querySelector(".edit")
      .addEventListener(
        "click",
        function() {

          editingId =
            card.id;


          $("modalTitle")
            .textContent =
            "Edit Flash Card";


          $("questionInput")
            .value =
            card.question;


          $("answerInput")
            .value =
            card.answer;


          $("cardModal")
            .classList.remove(
              "hidden"
            );

        }
      );


    // DELETE
    div
      .querySelector(".delete")
      .addEventListener(
        "click",
        async function() {

          if (
            confirm(
              "Delete this flash card?"
            )
          ) {

            await deleteItem(
              "flashcards",
              card.id
            );


            await loadFlashcards();

            await loadStudyCards();

          }

        }
      );


    container.appendChild(
      div
    );

  });

}


// ======================================================
// PDF NOTES
// ======================================================

$("pdfInput")
  .addEventListener(
    "change",
    async function(event) {

      const file =
        event.target.files[0];


      if (!file) return;


      if (
        file.type !==
        "application/pdf"
      ) {

        alert(
          "Please select a PDF file."
        );

        event.target.value = "";

        return;

      }


      try {

        await addItem(
          "pdfs",
          {
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
          }
        );


        await loadPDFs();


        event.target.value = "";

      } catch (error) {

        alert(
          "Could not save the PDF. Your browser may have reached its storage limit."
        );

        console.error(error);

      }

    }
  );


// ======================================================
// DISPLAY PDF FILES
// ======================================================

async function loadPDFs() {

  const pdfs =
    await getAll("pdfs");


  const container =
    $("pdfContainer");


  container.innerHTML = "";


  $("pdfEmpty")
    .classList.toggle(
      "hidden",
      pdfs.length > 0
    );


  pdfs.forEach(pdf => {

    const div =
      document.createElement(
        "div"
      );


    div.className =
      "pdf-card";


    div.innerHTML = `

      <div class="pdf-name">
        📄 ${escapeHTML(pdf.name)}
      </div>

      <div>
        ${formatFileSize(pdf.size)}
      </div>

      <div class="pdf-actions">

        <button class="primary open">
          Open
        </button>

        <button class="secondary delete">
          Delete
        </button>

      </div>

    `;


    // OPEN PDF
    div
      .querySelector(".open")
      .addEventListener(
        "click",
        function() {

          const url =
            URL.createObjectURL(
              pdf.file
            );


          window.open(
            url,
            "_blank"
          );


          setTimeout(
            function() {

              URL.revokeObjectURL(
                url
              );

            },
            60000
          );

        }
      );


    // DELETE PDF
    div
      .querySelector(".delete")
      .addEventListener(
        "click",
        async function() {

          if (
            confirm(
              "Delete this PDF?"
            )
          ) {

            await deleteItem(
              "pdfs",
              pdf.id
            );


            await loadPDFs();

          }

        }
      );


    container.appendChild(
      div
    );

  });

}


// ======================================================
// STUDY MODE
// ======================================================

async function loadStudyCards() {

  studyCards =
    await getAll(
      "flashcards"
    );


  if (
    studyCards.length === 0
  ) {

    $("studyEmpty")
      .classList.remove(
        "hidden"
      );


    $("studyArea")
      .classList.add(
        "hidden"
      );


    return;

  }


  $("studyEmpty")
    .classList.add(
      "hidden"
    );


  $("studyArea")
    .classList.remove(
      "hidden"
    );


  if (
    studyIndex >=
    studyCards.length
  ) {

    studyIndex = 0;

  }


  renderStudyCard();

}


// ======================================================
// SHUFFLE
// ======================================================

function shuffleCards() {

  for (
    let i =
      studyCards.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      studyCards[i],
      studyCards[j]
    ] =
    [
      studyCards[j],
      studyCards[i]
    ];

  }

}


$("shuffleBtn")
  .addEventListener(
    "click",
    async function() {

      await loadStudyCards();

      shuffleCards();

      studyIndex = 0;

      renderStudyCard();

    }
  );


// ======================================================
// CARD TYPE
// ======================================================

$("cardType")
  .addEventListener(
    "change",
    renderStudyCard
  );


// ======================================================
// RENDER STUDY CARD
// ======================================================

function renderStudyCard() {

  if (
    studyCards.length === 0
  ) return;


  const card =
    studyCards[studyIndex];


  const type =
    $("cardType").value;


  $("studyCounter")
    .textContent =
    `Card ${
      studyIndex + 1
    } of ${
      studyCards.length
    }`;


  $("choices")
    .innerHTML = "";


  $("studyAnswer")
    .classList.add(
      "hidden"
    );


  $("studyAnswer")
    .textContent = "";


  // CLASSIC
  if (type === "classic") {

    $("studyLabel")
      .textContent =
      "Question";


    $("studyQuestion")
      .textContent =
      card.question;


    $("showAnswerBtn")
      .classList.remove(
        "hidden"
      );

  }


  // REVERSE
  else if (
    type === "reverse"
  ) {

    $("studyLabel")
      .textContent =
      "Answer";


    $("studyQuestion")
      .textContent =
      card.answer;


    $("showAnswerBtn")
      .classList.remove(
        "hidden"
      );

  }


  // MULTIPLE CHOICE
  else if (
    type === "multiple"
  ) {

    $("studyLabel")
      .textContent =
      "Choose the correct answer";


    $("studyQuestion")
      .textContent =
      card.question;


    $("showAnswerBtn")
      .classList.add(
        "hidden"
      );


    renderMultipleChoice(
      card
    );

  }


  // TRUE OR FALSE
  else if (
    type === "truefalse"
  ) {

    $("studyLabel")
      .textContent =
      "True or False";


    $("studyQuestion")
      .textContent =
      `"${card.question}" has the answer: "${card.answer}"`;


    $("showAnswerBtn")
      .classList.add(
        "hidden"
      );


    renderTrueFalse(
      card
    );

  }

}


// ======================================================
// SHOW ANSWER
// ======================================================

$("showAnswerBtn")
  .addEventListener(
    "click",
    function() {

      const card =
        studyCards[studyIndex];


      const type =
        $("cardType").value;


      $("studyAnswer")
        .textContent =
        type === "reverse"
          ? card.question
          : card.answer;


      $("studyAnswer")
        .classList.remove(
          "hidden"
        );

    }
  );


// ======================================================
// MULTIPLE CHOICE
// ======================================================

function renderMultipleChoice(
  card
) {

  const answers = [
    card.answer
  ];


  studyCards

    .filter(
      c =>
        c.id !== card.id
    )

    .sort(
      () =>
        Math.random() -
        0.5
    )

    .slice(0, 3)

    .forEach(c => {

      answers.push(
        c.answer
      );

    });


  answers.sort(
    () =>
      Math.random() -
      0.5
  );


  answers.forEach(
    answer => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "choice";


      button.textContent =
        answer;


      button.addEventListener(
        "click",
        function() {

          document
            .querySelectorAll(
              ".choice"
            )
            .forEach(
              b => {
                b.disabled =
                  true;
              }
            );


          if (
            answer ===
            card.answer
          ) {

            button.classList.add(
              "correct"
            );

          } else {

            button.classList.add(
              "wrong"
            );


            document
              .querySelectorAll(
                ".choice"
              )
              .forEach(
                b => {

                  if (
                    b.textContent ===
                    card.answer
                  ) {

                    b.classList.add(
                      "correct"
                    );

                  }

                }
              );

          }

        }
      );


      $("choices")
        .appendChild(
          button
        );

    }
  );

}


// ======================================================
// TRUE OR FALSE
// ======================================================

function renderTrueFalse(
  card
) {

  const trueButton =
    document.createElement(
      "button"
    );


  const falseButton =
    document.createElement(
      "button"
    );


  trueButton.className =
    "choice";


  falseButton.className =
    "choice";


  trueButton.textContent =
    "TRUE";


  falseButton.textContent =
    "FALSE";


  trueButton.addEventListener(
    "click",
    function() {

      trueButton.classList.add(
        "correct"
      );


      trueButton.disabled =
        true;


      falseButton.disabled =
        true;

    }
  );


  falseButton.addEventListener(
    "click",
    function() {

      falseButton.classList.add(
        "wrong"
      );


      trueButton.classList.add(
        "correct"
      );


      trueButton.disabled =
        true;


      falseButton.disabled =
        true;

    }
  );


  $("choices")
    .appendChild(
      trueButton
    );


  $("choices")
    .appendChild(
      falseButton
    );

}


// ======================================================
// PREVIOUS / NEXT
// ======================================================

$("prevBtn")
  .addEventListener(
    "click",
    function() {

      if (
        !studyCards.length
      ) return;


      studyIndex =
        (
          studyIndex -
          1 +
          studyCards.length
        ) %
        studyCards.length;


      renderStudyCard();

    }
  );


$("nextBtn")
  .addEventListener(
    "click",
    function() {

      if (
        !studyCards.length
      ) return;


      studyIndex =
        (
          studyIndex +
          1
        ) %
        studyCards.length;


      renderStudyCard();

    }
  );


// ======================================================
// START APPLICATION
// ======================================================

async function startApp() {

  try {

    // Open local database
    await openDatabase();


    // Load saved flashcards
    await loadFlashcards();


    // Load saved PDFs
    await loadPDFs();


    // Load Study Mode
    await loadStudyCards();


    // ==================================================
    // SERVICE WORKER
    // ==================================================

    if (
      "serviceWorker" in navigator
    ) {

      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )

        .then(
          function() {

            console.log(
              "Service Worker registered successfully."
            );

          }
        )

        .catch(
          function(error) {

            console.error(
              "Service Worker registration failed:",
              error
            );

          }
        );

    }

  } catch (error) {

    console.error(
      "Application error:",
      error
    );


    alert(
      "The app could not open its local database."
    );

  }

}


// Start
startApp();