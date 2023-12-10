const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const {
  loadContact,
  findContact,
  addContact,
  cekDuplikat,
  deleteContact,
  updateContacts,
} = require("./function/contacts");
const { body, validationResult, check } = require("express-validator");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Shared data for rendering
const sharedData = {
  layout: "layouts/main-layout",
};

// Render data for /index and /
const renderIndex = (req, res) => {
  const mahasiswa = [
    {
      nama: "Mochammad Rizky Ramadhani",
      email: "rizkyramadhani181102@gmail.com",
    },
    {
      nama: "Rafael",
      email: "Rafael29@gmail.com",
    },
  ];

  res.render("index", {
    nama: "Mochammad Rizky Ramadhani",
    title: "Halaman Home",
    mahasiswa: mahasiswa,
    ...sharedData,
  });
};

app.get(["/index", "/"], renderIndex);

app.get("/about", (req, res) => {
  res.render("about", {
    title: "Halaman About",
    ...sharedData,
  });
});

app.get("/contact", (req, res) => {
  const contacts = loadContact();

  res.render("contact", {
    title: "Halaman Contact",
    contacts,
    msg: req.flash("msg"),
    ...sharedData,
  });
});

// halaman form tambah data contact
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Form Tambah Data Contact",
    ...sharedData,
  });
});

// proses data contact
app.post(
  "/contact",
  [
    body("nama").custom((value) => {
      const duplikat = cekDuplikat(value);
      if (duplikat) {
        throw new Error("Nama contact sudah digunakan");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nomor", "Nomor HP tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Form Tambah Data Contact",
        errors: errors.array(),
        ...sharedData,
      });
    } else {
      addContact(req.body);
      // kirim flash message
      req.flash("msg", "Data contact berhasil ditambahkan");
      res.redirect("/contact");
    }
  }
);

// proses delete contact
app.get("/contact/delete/:nama", (req, res) => {
  const contact = findContact(req.params.nama);

  // jika contact tidak ada
  if (!contact) {
    res.status(404);
    res.send("<h1>404</h1>");
  } else {
    deleteContact(req.params.nama);
    req.flash("msg", "Data contact berhasil dihapus");
    res.redirect("/contact");
  }
});

// form edit data contact
app.get("/contact/edit/:nama", (req, res) => {
  const contact = findContact(req.params.nama);
  res.render("edit-contact", {
    title: "Form Tambah Edit Data Contact",
    contact,
    ...sharedData,
  });
});

// proses edit data
app.post(
  "/contact/update",
  [
    body("nama").custom((value, { req }) => {
      const duplikat = cekDuplikat(value);
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama contact sudah digunakan");
      }
      return true;
    }),
    check("email", "Email tidak valid!").isEmail(),
    check("nomor", "Nomor HP tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("edit-contact", {
        title: "Form Edit Data Contact",
        errors: errors.array(),
        contact: req.body,
        ...sharedData,
      });
    } else {
      updateContacts(req.body);
      // kirim flash message
      req.flash("msg", "Data contact berhasil diubah");
      res.redirect("/contact");
    }
  }
);

// halaman detail contact
app.get("/contact/:nama", (req, res) => {
  const contact = findContact(req.params.nama);

  res.status(200);
  res.render("detail", {
    title: "Halaman Detail Contact",
    contact,
    ...sharedData,
  });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send("<h1>Halaman tidak ditemukan!</h1>");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
