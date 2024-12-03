const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

///////////assign pharmacy/////////////////
const assignpharmacy = async (request, response) => {
    try {
      let { sales_id, pharmacy_id,status } = request.body
      
      const datetime = getCurrentDateInIST();
  
      // Validate the required fields
      if (!sales_id || pharmacy_id) {
        return response.status(400).json({
          error: true,
          message: "sales_id and pharmacy_id can't be null or empty.",
        });
      }
  
    
        const add = await prisma.pharmacyquotation.create({
          data: {
            status: status,
            sales_id: sales_id,
            pharmacy_id: pharmacy_id,
            created_date: datetime,
            Stmodified_date:datetime
          },
        });
  
        if (add) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Pharmacy assigned successfully.",
          });
        }
      
    } catch (error) {
      logger.error(
        `Internal server error: ${error.message} in pharmacy-assignpharmacy API`
      );
      console.error(error);
      response.status(500).json({ error: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  };

  const getpackedorders = async (request, response) => {
    try {
      const allorders = await prisma.pharmacyquotation.findMany({
        where: {
          status: "packed",
        },
      });
      if (allproducts.length > 0) {
        return response.status(200).json({
          data: allorders,
          success: true,
        });
      }
    } catch (error) {
      logger.error(
        `Internal server error: ${error.message} in pharmacyquotation getpackedorders from pharmacy API`
      );
      response.status(500).json({
        error: true,
        message: "Internal server error",
      });
    } finally {
      await prisma.$disconnect();
    }
  };


  module.exports = { assignpharmacy,getpackedorders}