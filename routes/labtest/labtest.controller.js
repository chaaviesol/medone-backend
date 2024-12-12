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
      data: register_data,
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
      data: register_data,
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
