const Class = require('../models/Class');
const User = require('../models/User');

const classController = {
    async createClass(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Class name is required' });
            }

            const classId = await Class.create({
                name,
                description,
                created_by: req.user.id
            });

            const classData = await Class.findById(classId);
            res.status(201).json({ class: classData });
        } catch (error) {
            console.error('CreateClass error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getAllClasses(req, res) {
        try {
            const classes = await Class.getAll();
            res.json({ classes });
        } catch (error) {
            console.error('GetAllClasses error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async assignCR(req, res) {
        try {
            const { classId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Verify user is a student
            const user = await User.findById(userId);
            if (!user || user.role !== 'student') {
                return res.status(400).json({ error: 'Only students can be assigned as CR' });
            }

            await Class.assignCR(classId, userId);
            res.json({ message: 'CR assigned successfully' });
        } catch (error) {
            console.error('AssignCR error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getClassCRs(req, res) {
        try {
            const { classId } = req.params;

            const crs = await Class.getCRs(classId);
            res.json({ crs });
        } catch (error) {
            console.error('GetClassCRs error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = classController;
