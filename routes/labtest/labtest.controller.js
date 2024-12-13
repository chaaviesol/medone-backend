const {
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
  decrypt,
} = require("../../utils");
const bcrypt = require("bcrypt");
const datetime = getCurrentDateInIST();
require("dotenv").config();

const labtestadd = async (request, response) => {
  const {
    name,
    mrp,
    description,
    status,
    photo,
    type,
    category,
    home_collection,
    gender,
    age_group,
  } = request.body;
  const datetime = getCurrentDateInIST();
  try {
    const adddata = await prisma.labtest_details.create({
      data: {
        name,
        mrp,
        description,
        status,
        photo,
        type,
        category,
        home_collection,
        gender,
        age_group,
        created_date: datetime,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "successfully created",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestass api`
    );
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const getlabtests = async (request, response) => {
  try {
    const getall = await prisma.labtest_details.findMany();
    if (getall.length > 0) {
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-getlabtests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const package_add = async (request, response) => {
  const { package_name, price, created_date, status, labtest_ids } =
    request.body;
  const datetime = getCurrentDateInIST();
  try {
    const add_data = await prisma.lab_packages.create({
      data: {
        package_name,
        price,
        created_date,
        status,
        labtest_ids,
        created_date: datetime,
      },
    });

    response.status(200).json({
      error: false,
      success: true,
      message: "successfully created",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in labtest---labtestass api`
    );
    response.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

const getpackagetests = async (request, response) => {
  try {
    const getall = await prisma.lab_packages.findMany();
    if (getall.length > 0) {
      for(const package of getall) {
        const find=await prisma.labtest_details.findFirst({
          where:{
            
          }
        });

      }
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labtest-getpackagetests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  labtestadd,
  getlabtests,
  package_add,
  getpackagetests
};
