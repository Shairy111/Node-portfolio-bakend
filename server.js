// import express from 'express';
const express = require("express");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const path = require("path");
// const data = require("./data.js");
const Project = require("./models/ProjectModel.js");
const User = require("./models/userModel.js");
// const projectRoutes = require("./routes/projectRouter.js");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/authMiddleware.js")
const cookieParser = require("cookie-parser")
const dotenv = require("dotenv");

dotenv.config();

//try new model
// const New = require("./models/newModel.js");

const PORT = process.env.PORT || 5000;

//upload library import
var multer = require("multer");

const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser())
const mongodb = process.env.DB_CONNECT;

mongoose.connect(mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.get(
  "/api/projects",
  asyncHandler(async (req, res) => {
    const project = await Project.find({});
    if (project) {
      res.send(project);
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

app.get(
  "/api/project/:id/detail",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project) {
      res.send(project);
    } else {
      res.status(404).send({ message: "could not found the product" });
    }
  })
);

app.post(
  "/api/projects/add",
  asyncHandler(async (req, res) => {
    const project = new Project({
      title: req.body.title,
      category: req.body.category,
      description: req.body.desc,
      image: req.body.image,
      detail: {
        detailDesc: req.body.detaildesc,
        techStack: req.body.tech,
        link: req.body.link,
      },
    });
    const createdProject = await project.save();
    res.send({ message: "project created", project: createdProject });
  })
);

//all the upload logic shouldnt be here but its in development its ok for now
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.jpg`);
  },
});

const upload = multer({ storage: storage });

//upload route

app.post("/api/uploads", upload.single("image"), (req, res) => {
  res.send(`/${req.file.path}`);
});

app.delete(
  "/api/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project) {
      const deletedProject = await project.remove();
      res.send({ message: "product deleted", deletedProject });
    } else {
      console.log("garry you idiot");
    }
  })
);

//----------------------------------------------USER_AUTHENTICATION RELATED STUFF-----------------------------
// User related Stuff
app.post(
  "/api/auth/register",auth,
  asyncHandler(async (req, res) => {
    // const createdUser = await User.insertMany(data.Users);
    // res.send({createdUser});
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(404).send({ message: "invalid credentials" });
    }
    const user = await User.findOne({ email });
    if (user) {
      res.status(400).send({ message: "user already exist" });
    } else {
      const hashed_password = bcrypt.hashSync(password, 7);
      const user = new User({
        name: name,
        email: email,
        password: hashed_password,
      });

      const saved_user = await user.save();
      const token = jwt.sign(
        {
          _id: saved_user._id,
        },
        process.env.JWT_SECRET
      );

      res.cookie("token", token, { httpOnly: true }).send();
      res.send({
        _id: saved_user._id,
        name: saved_user.name,
        email: saved_user.email,
        password: saved_user.password,
      });
    }
  })
);

//authenticating user
app.post(
  "/api/auth/login", 
  asyncHandler(async (req, res) => {
    const SignedUser = await User.findOne({ email: req.body.email });
    if (SignedUser) {
      const password = bcrypt.compareSync(
        req.body.password,
        SignedUser.password
      );

      console.log("password");
      const token = jwt.sign(
        {
          _id: SignedUser._id,
        },
        process.env.JWT_SECRET
      );
      res.cookie("token", token, { httpOnly: true }).send();
      // res.send({
      //   _id: SignedUser._id,
      //   name: SignedUser.name,
      //   email: SignedUser.email,
      //   isAdmin: SignedUser.isAdmin,
      // });
      if (!password) {
        res.status(401).send({ message: "wrong password" });
      }
    }

    res.status(401).send({ message: "wrong email or password" });
  })
);

app.get("/api/auth/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    })
    .send();
});


app.get("/api/auth/loggedIn" , (req , res)=>{
  try {
    const token = req.cookies.token

    if(!token){
        return res.json(false)  
    }
    jwt.verify(token,process.env.JWT_SECRET); 
    res.send(true)


} catch (error) {
    res.json(false);
}
})
//--------------------------------------------------------------------------------------------

// Test Route
app.get(
  "/api/category/:name",
  asyncHandler(async (req, res) => {
    const category = await Project.find({ category: req.params.name });
    if (category) {
      res.send(category);
    } else {
      res.send("error");
    }
  })
);

// app.post("/new" , asyncHandler(async (req, res) => {
//     const new1 = new New({
//       title: "A great project",
//       description : "it is agreat grat project",
//       image : "some random url",
//       detail : {
//         detailDesc : "a very long desc",
//         techStack : ["python" , "ruby"]
//       }
//     });

//     await new1.save();
// }))

//-------------------------------EDITING ROUTES--------------------------------

app.post(
  "/api/:id/edit",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project) {
      res.send(project);
    } else {
      res.send("error");
    }
  })
);

app.put(
  "/api/:id/edit",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project) {
      await project.updateOne({
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        detail: {
          techStack: req.body.techStack,
        },
      });

      project.save();
      //  const items = []

      //   req.body.list.map(item => items.push(item))
      res.send(project);
    } else {
      res.send("error");
    }
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//upload configuration route

const __Dirname = path.resolve();
app.use("/uploads", express.static(path.join(__Dirname, "/uploads")));
app.use(express.static(path.join(__Dirname, "/frontend/build")));


//-----------------------server static assets in production-------------------------------

// app.use(express.static(path.join(__dirname,'/frontend/build')));
// app.get('*',(req, res)=>{
//     res.sendFile(path.join(__dirname,'/frontend/build/index.html'))
// })

app.listen(PORT, () => {
  console.log("server is running on port 5000");
});

//-----------------------------------END------------------------------------------------

// app.get(
//   "/api/projects",
//   asyncHandler(async (req, res) => {
//     const project = await Project.find({});
//     if (project) {
//       res.send(project);
//     } else {
//       res.status(404).send({ message: "Product Not Found" });
//     }
//   })
// );

// app.get("/api/project/:id/detail" , asyncHandler(async(req , res) => {
//     const project = await Project.findById(req.params.id);
//     if(project){
//         res.send(project)
//     }else{
//         res.status(404).send({message : "could not found the product"})
//     }
// }))

// app.use('/api' , projectRoutes);
