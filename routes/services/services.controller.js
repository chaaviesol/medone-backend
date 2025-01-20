const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

const addhospitalassistance = async (request, response) => {
  try {
    let {
      type,
      mobility,
      patient_name,
      age,
      gender,
      contact_person_name,
      contact_person_phone_no,
      location,
      hospital_name,
      date,
      medication_records,
    } = JSON.parse(request.body.data);
    const imageLink = request.file?.location;
    const datetime = getCurrentDateInIST();

    const add = await prisma.hospital_assistance.create({
      data: {
        type,
        mobility,
        patient_name,
        age,
        gender,
        contact_person_name,
        contact_person_phone_no,
        location,
        hospital_name,
        date,
        medication_records,
      },
    });

    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Category created successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-addhsopitalassistance API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const getrequests = async (request, response) => {
  try {
    const allrequests = await prisma.hospital_assistance.findMany({
      where: {
        status: "requested",
      },
    });
    if (allrequests.length > 0) {
      return response.status(200).json({
        data: allrequests,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in  hospital assistant- getrequests API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const addhomecare = async (request, response) => {
  try {
    let {
      type,
      mobility,
      patient_name,
      age,
      gender,
      requiring_care,
      contact_person_name,
      contact_person_phone_no,
      location,
      hospital_name,
      date,
      medication_records,
    } = JSON.parse(request.body.data);
    const imageLink = request.file?.location;
    const datetime = getCurrentDateInIST();

    const add = await prisma.hospital_assistance.create({
      data: {
        type,
        mobility,
        patient_name,
        age,
        gender,
        requiring_care,
        contact_person_name,
        contact_person_phone_no,
        location,
        hospital_name,
        date,
        medication_records,
      },
    });

    if (add) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Category created successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-homecare API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};