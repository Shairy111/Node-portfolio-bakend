const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    image: String,
    detail: {
      detailDesc: String,
      techStack: [String],
      link: [String]
    }
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project;