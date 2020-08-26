const express = require('express');
const authMiddleware = require('../middlewares/auth');

const Project = require('../models/Project');
const Task = require('../models/Task');


const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try{
        const projects = await Project.find().populate(['user', 'tasks']);
    
        return res.send( { projects } );
    }catch(e){
        return res.status(400).send({ error: e})
    }
});

router.get('/:projectId', async(req, res) => {
    try{
        const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']);
    
        return res.send( { project } );
    }catch(e){
        return res.status(400).send({ error: e})
    }
});

router.post('/', async(req, res) => {
    try{
        const { title, description, tasks } = req.body;

        const project = await Project.create( { title, description, user: req.userId });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({
                ...task, project: project._id, assignedTo: req.userId
            });

            await projectTask.save();
            project.tasks.push(projectTask);    

        
        }));

        await project.save();
        
        return res.send( { project } );
    }catch(e){
        return res.status(400).send({ error: e})
    }
});

router.put('/:projectId', async(req, res) => {
    try{
        const { title, description, tasks } = req.body;

        const project = await Project.findByIdAndUpdate( req.params.projectId, { 
            title, description
        }, {
            new: true
        });

        project.tasks = [];
        await Task.deleteMany( { project: project._id} );

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({
                ...task, project: project._id, assignedTo: req.userId
            });

            await projectTask.save();
            project.tasks.push(projectTask);    

        
        }));

        await project.save();
        
        return res.send( { project } );
    }catch(e){
        return res.status(400).send({ error: e})
    }
});

router.delete('/:projectId', async(req, res) => {
    try{
        const project = await Project.findByIdAndRemove(req.params.projectId);
    
        return res.send();
    }catch(e){
        return res.status(400).send({ error: e})
    }
});

module.exports = app => app.use('/projects', router);
