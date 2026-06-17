const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const FoodDatabase = require('../../models/FoodDatabase');
const AdminActionLog = require('../../models/AdminActionLog');
const { authenticateAdmin, requirePermission, logAdminAction } = require('../../middleware/adminAuth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/food-data/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all food items with pagination and filtering
router.get('/', authenticateAdmin, requirePermission('food.read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      verified = '',
      status = 'active',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrderNum = sortOrder === 'desc' ? -1 : 1;

    const options = {
      category: category || undefined,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      status,
      limit: parseInt(limit),
      skip,
      sortBy,
      sortOrder: sortOrderNum
    };

    const foods = await FoodDatabase.searchFoods(search, options);
    
    // Get total count for pagination
    const countQuery = { status };
    if (search) countQuery.$text = { $search: search };
    if (category) countQuery.category = category;
    if (verified !== '') countQuery['dataQuality.verified'] = verified === 'true';
    
    const totalFoods = await FoodDatabase.countDocuments(countQuery);
    const totalPages = Math.ceil(totalFoods / parseInt(limit));

    res.json({
      success: true,
      data: {
        foods,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFoods,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOODS_FETCH_ERROR', message: 'Failed to fetch food items.' }
    });
  }
});

// Get single food item details
router.get('/:foodId', authenticateAdmin, requirePermission('food.read'), async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const food = await FoodDatabase.findById(foodId)
      .populate('createdBy updatedBy', 'email role')
      .populate('dataQuality.verifiedBy', 'email role');
    
    if (!food) {
      return res.status(404).json({
        success: false,
        error: { code: 'FOOD_NOT_FOUND', message: 'Food item not found.' }
      });
    }

    res.json({
      success: true,
      data: { food }
    });

  } catch (error) {
    console.error('Get food details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_DETAILS_ERROR', message: 'Failed to fetch food details.' }
    });
  }
});

// Create new food item
router.post('/', authenticateAdmin, requirePermission('food.create'), logAdminAction('food_create'), async (req, res) => {
  try {
    const foodData = {
      ...req.body,
      createdBy: req.admin.id,
      updatedBy: req.admin.id
    };

    const food = new FoodDatabase(foodData);
    await food.save();

    const populatedFood = await FoodDatabase.findById(food._id)
      .populate('createdBy updatedBy', 'email role');

    res.status(201).json({
      success: true,
      data: { food: populatedFood },
      message: 'Food item created successfully.'
    });

  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_CREATE_ERROR', message: 'Failed to create food item.' }
    });
  }
});

// Update food item
router.put('/:foodId', authenticateAdmin, requirePermission('food.update'), logAdminAction('food_update'), async (req, res) => {
  try {
    const { foodId } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.admin.id
    };

    const food = await FoodDatabase.findByIdAndUpdate(
      foodId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'email role');
    
    if (!food) {
      return res.status(404).json({
        success: false,
        error: { code: 'FOOD_NOT_FOUND', message: 'Food item not found.' }
      });
    }

    res.json({
      success: true,
      data: { food },
      message: 'Food item updated successfully.'
    });

  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_UPDATE_ERROR', message: 'Failed to update food item.' }
    });
  }
});

// Delete food item
router.delete('/:foodId', authenticateAdmin, requirePermission('food.delete'), logAdminAction('food_delete'), async (req, res) => {
  try {
    const { foodId } = req.params;
    
    const food = await FoodDatabase.findByIdAndDelete(foodId);
    
    if (!food) {
      return res.status(404).json({
        success: false,
        error: { code: 'FOOD_NOT_FOUND', message: 'Food item not found.' }
      });
    }

    res.json({
      success: true,
      message: 'Food item deleted successfully.'
    });

  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_DELETE_ERROR', message: 'Failed to delete food item.' }
    });
  }
});

// Verify food item
router.patch('/:foodId/verify', authenticateAdmin, requirePermission('food.verify'), logAdminAction('food_verify'), async (req, res) => {
  try {
    const { foodId } = req.params;
    const { verified, confidence } = req.body;
    
    const updateData = {
      'dataQuality.verified': Boolean(verified),
      'dataQuality.verifiedBy': req.admin.id,
      'dataQuality.verifiedAt': new Date(),
      updatedBy: req.admin.id
    };
    
    if (confidence !== undefined) {
      updateData['dataQuality.confidence'] = confidence;
    }

    const food = await FoodDatabase.findByIdAndUpdate(
      foodId,
      updateData,
      { new: true }
    ).populate('createdBy updatedBy dataQuality.verifiedBy', 'email role');
    
    if (!food) {
      return res.status(404).json({
        success: false,
        error: { code: 'FOOD_NOT_FOUND', message: 'Food item not found.' }
      });
    }

    res.json({
      success: true,
      data: { food },
      message: `Food item ${verified ? 'verified' : 'unverified'} successfully.`
    });

  } catch (error) {
    console.error('Verify food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_VERIFY_ERROR', message: 'Failed to verify food item.' }
    });
  }
});

// Bulk operations
router.post('/bulk', authenticateAdmin, requirePermission('food.update'), logAdminAction('food_bulk_operation'), async (req, res) => {
  try {
    const { operation, foodIds, data } = req.body;
    
    if (!Array.isArray(foodIds) || foodIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Food IDs array is required.' }
      });
    }

    let result;
    const updateData = { updatedBy: req.admin.id };
    
    switch (operation) {
      case 'verify':
        updateData['dataQuality.verified'] = true;
        updateData['dataQuality.verifiedBy'] = req.admin.id;
        updateData['dataQuality.verifiedAt'] = new Date();
        result = await FoodDatabase.updateMany(
          { _id: { $in: foodIds } },
          updateData
        );
        break;
        
      case 'unverify':
        updateData['dataQuality.verified'] = false;
        result = await FoodDatabase.updateMany(
          { _id: { $in: foodIds } },
          updateData
        );
        break;
        
      case 'activate':
        updateData.status = 'active';
        result = await FoodDatabase.updateMany(
          { _id: { $in: foodIds } },
          updateData
        );
        break;
        
      case 'deactivate':
        updateData.status = 'inactive';
        result = await FoodDatabase.updateMany(
          { _id: { $in: foodIds } },
          updateData
        );
        break;
        
      case 'delete':
        result = await FoodDatabase.deleteMany({ _id: { $in: foodIds } });
        break;
        
      case 'update':
        if (!data) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_INPUT', message: 'Update data is required.' }
          });
        }
        result = await FoodDatabase.updateMany(
          { _id: { $in: foodIds } },
          { ...data, updatedBy: req.admin.id }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPERATION', message: 'Invalid bulk operation.' }
        });
    }

    res.json({
      success: true,
      data: {
        operation,
        affectedItems: result.modifiedCount || result.deletedCount,
        totalRequested: foodIds.length
      },
      message: `Bulk ${operation} completed successfully.`
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'BULK_OPERATION_ERROR', message: 'Failed to perform bulk operation.' }
    });
  }
});

// Import food data from CSV
router.post('/import', authenticateAdmin, requirePermission('food.create'), upload.single('csvFile'), logAdminAction('food_import'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'CSV file is required.' }
      });
    }

    const results = [];
    const errors = [];
    let processed = 0;
    let imported = 0;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          processed++;
          
          // Map CSV columns to food database schema
          const foodData = {
            name: row.name || row.Name,
            category: row.category || row.Category || 'other',
            nutrition: {
              calories: parseFloat(row.calories || row.Calories || 0),
              protein: parseFloat(row.protein || row.Protein || 0),
              carbs: parseFloat(row.carbs || row.Carbohydrates || 0),
              fat: parseFloat(row.fat || row.Fat || 0),
              fiber: parseFloat(row.fiber || row.Fiber || 0),
              sugar: parseFloat(row.sugar || row.Sugar || 0),
              sodium: parseFloat(row.sodium || row.Sodium || 0)
            },
            createdBy: req.admin.id,
            updatedBy: req.admin.id,
            status: 'pending_review'
          };

          // Add micronutrients if available
          if (row.vitamin_c || row['Vitamin C']) {
            foodData.micronutrients = {
              vitaminC_mg: parseFloat(row.vitamin_c || row['Vitamin C'] || 0),
              calcium_mg: parseFloat(row.calcium || row.Calcium || 0),
              iron_mg: parseFloat(row.iron || row.Iron || 0)
            };
          }

          const food = new FoodDatabase(foodData);
          await food.save();
          imported++;
          
        } catch (error) {
          errors.push({
            row: processed,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          data: {
            processed,
            imported,
            errors: errors.length,
            errorDetails: errors.slice(0, 10) // Return first 10 errors
          },
          message: `Import completed. ${imported} items imported, ${errors.length} errors.`
        });
      })
      .on('error', (error) => {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.status(500).json({
          success: false,
          error: { code: 'IMPORT_ERROR', message: 'Failed to import CSV file.' }
        });
      });

  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import food data.' }
    });
  }
});

// Get food database statistics
router.get('/stats/summary', authenticateAdmin, requirePermission('food.read'), async (req, res) => {
  try {
    const [
      totalFoods,
      verifiedFoods,
      pendingReview,
      activeFoods,
      inactiveFoods,
      categoryStats,
      recentlyAdded
    ] = await Promise.all([
      FoodDatabase.countDocuments(),
      FoodDatabase.countDocuments({ 'dataQuality.verified': true }),
      FoodDatabase.countDocuments({ status: 'pending_review' }),
      FoodDatabase.countDocuments({ status: 'active' }),
      FoodDatabase.countDocuments({ status: 'inactive' }),
      FoodDatabase.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      FoodDatabase.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get most used foods
    const mostUsed = await FoodDatabase.find()
      .sort({ 'usage.recognitionCount': -1 })
      .limit(5)
      .select('name usage.recognitionCount usage.manualEntryCount');

    res.json({
      success: true,
      data: {
        summary: {
          totalFoods,
          verifiedFoods,
          pendingReview,
          activeFoods,
          inactiveFoods,
          recentlyAdded
        },
        categoryStats,
        mostUsed
      }
    });

  } catch (error) {
    console.error('Food stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FOOD_STATS_ERROR', message: 'Failed to fetch food statistics.' }
    });
  }
});

// GET /api/admin/food/user-logged - All foods logged by users from daily trackings
router.get('/user-logged', authenticateAdmin, requirePermission('food.read'), async (req, res) => {
  try {
    const DailyTracking = require('../../models/DailyTracking');
    const { page = 1, limit = 50, source = '', search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate all food entries from all daily trackings
    const matchStage = {};
    if (source) matchStage['foodEntries.source'] = source;

    const pipeline = [
      { $unwind: '$foodEntries' },
      ...(source ? [{ $match: { 'foodEntries.source': source } }] : []),
      ...(search ? [{ $match: { 'foodEntries.name': { $regex: search, $options: 'i' } } }] : []),
      {
        $project: {
          _id: 0,
          foodName: '$foodEntries.name',
          quantity: '$foodEntries.quantity',
          calories: '$foodEntries.calories',
          protein: '$foodEntries.protein',
          carbs: '$foodEntries.carbs',
          fats: '$foodEntries.fats',
          source: '$foodEntries.source',
          imageUrl: '$foodEntries.imageUrl',
          loggedAt: '$foodEntries.timestamp',
          userEmail: '$userEmail',
          date: '$date'
        }
      },
      { $sort: { loggedAt: -1 } }
    ];

    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: parseInt(limit) }];

    const [entries, countResult] = await Promise.all([
      DailyTracking.aggregate(dataPipeline),
      DailyTracking.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('User logged foods error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Search foods (public endpoint for food recognition)
router.get('/search/public', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required.' }
      });
    }

    const foods = await FoodDatabase.searchFoods(q, {
      status: 'active',
      verified: true,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { foods }
    });

  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Failed to search foods.' }
    });
  }
});

module.exports = router;