const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

const addhospitalassistenquiry = async (request, response) => {
  try {
    const { patient_name, patient_contact_no } = request.body;
    const datetime = getCurrentDateInIST();
    const find = await prisma.hospitalAssist_service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        created_date: datetime,
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });
    if (!find) {
      const add = await prisma.hospitalAssist_service.create({
        data: {
          patient_name,
          patient_contact_no,
          status: "enquired",
          created_date: datetime,
        },
      });
      if (add) {
        const adddata = {
          id: add.id,
        };
        return response.status(200).json({
          success: true,
          error: false,
          data: adddata,
          message: "enquiry created successfully.",
        });
      }
    } else {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "enquiry created successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-addhospitalassistenquiry API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addhospitalassist = async (request, response) => {
  try {
    let {
      id,
      type,
      patient_mobility,
      patient_name,
      patient_age,
      paitent_gender,
      hospital_name,
      patient_contact_no,
      patient_location,
      assist_type,
      location,
      start_date,
      time,
      days_week,
      hospital_location,
      pickup_type,
      requirements,
    } = JSON.parse(request.body.data);
    const documents = request.files;
    let medical_documents = {};

    if (!documents || documents.length === 0) {
      return response.status(400).json({
        message: "Please attach at least one report",
        error: true,
      });
    }

    for (i = 0; i < documents?.length; i++) {
      let keyName = `image${i + 1}`;
      medical_documents[keyName] = documents[i].location;
    }
    const datetime = getCurrentDateInIST();

    const updatedata = await prisma.hospitalAssist_service.update({
      where: {
        id: id,
      },
      data: {
        type,
        mobility,
        patient_name,
        patient_mobility,
        patient_age,
        paitent_gender,
        status:"requested",
        contact_person_name,
        patient_contact_no,
        assist_type,
        location,
        hospital_name,
        patient_location,
        medication_records,
        start_date,
        time,
        days_week,
        hospital_location,
        pickup_type,
        requirements,
        medical_documents: medical_documents,
      },
    });

    if (updatedata) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Requested successfully.",
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

const gethospitalassistantreqs = async (request, response) => {
  try {
    const allrequests = await prisma.hospitalAssist_service.findMany({
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
      `Internal server error: ${error.message} in  hospitalassistant- getrequests API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const physiotherapyenquiry = async (request, response) => {
  try {
    const { patient_name, patient_contact_no } = request.body;
    const datetime = getCurrentDateInIST();
    const find = await prisma.physiotherapist_service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        created_date: datetime,
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });
    if (!find) {
      const add = await prisma.physiotherapist_service.create({
        data: {
          patient_name,
          patient_contact_no,
          status:"enquired",
          created_date: datetime,
        },
      });
      if (add) {
        const adddata = {
          id: add.id,
        };
        return response.status(200).json({
          success: true,
          error: false,
          data: find,
          message: "enquiry created successfully.",
        });
      }
    } else {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "enquiry created successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-addhospitalassistenquiry API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addphysiotherapy = async (request, response) => {
  try {
    let {
      id,
      type,
      patient_mobility,
      patient_name,
      patient_age,
      paitent_gender,
      hospital_name,
      patient_contact_no,
      patient_location,
      assist_type,
      location,
      start_date,
      time,
      days_week,
      hospital_location,
      pickup_type,
      requirements,
    } = JSON.parse(request.body.data);
    const documents = request.files;
    let medical_documents = {};

    if (!documents || documents.length === 0) {
      return response.status(400).json({
        message: "Please attach at least one report",
        error: true,
      });
    }

    for (i = 0; i < documents?.length; i++) {
      let keyName = `image${i + 1}`;
      medical_documents[keyName] = documents[i].location;
    }
    const datetime = getCurrentDateInIST();

    const updatedata = await prisma.physiotherapist_service.update({
      where: {
        id: id,
      },
      data: {
        type,
        mobility,
        patient_name,
        patient_mobility,
        patient_age,
        paitent_gender,
        contact_person_name,
        patient_contact_no,
        assist_type,
        location,
        hospital_name,
        patient_location,
        medication_records,
        start_date,
        time,
        days_week,
        hospital_location,
        pickup_type,
        requirements,
        medical_documents: medical_documents,
        status:"requested",
      },
    });

    if (updatedata) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Requested successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-physiotherapist_service{
 API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const getphysiotherapyreqs = async (request, response) => {
  try {
    const allrequests = await prisma.hospitalAssist_service.findMany({
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
      `Internal server error: ${error.message} in  hospitalassistant- getrequests API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};


//////home service///////
const addhomeServiceenquiry = async (request, response) => {
  try {
    const { patient_name, patient_contact_no } = request.body;
    const datetime = getCurrentDateInIST();
    const find = await prisma.homeCare_Service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        created_date: datetime,
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });
    if (!find) {
      const add = await prisma.homeCare_Service.create({
        data: {
          patient_name,
          patient_contact_no,
          status: "enquired",
          created_date: datetime,
        },
      });
      if (add) {
        const adddata = {
          id: add.id,
        };
        return response.status(200).json({
          success: true,
          error: false,
          data: adddata,
          message: "enquiry created successfully.",
        });
      }
    } else {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "enquiry created successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-addhomeServiceenquiry API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addhomeservice = async (request, response) => {
  try {
    let {
      id,
      patient_mobility,
      patient_name,
      patient_age,
      patient_gender,
      patient_contact_no,
      patient_location,
      start_date,
      days_week,
      requirements,
      general_specialized,
      
    } = JSON.parse(request.body.data);
    // } = (request.body)

    const documents = request.files;
    let medical_documents = {};

    if (!documents || documents.length === 0) {
      return response.status(400).json({
        message: "Please attach at least one report",
        error: true,
      });
    }

    for (i = 0; i < documents?.length; i++) {
      let keyName = `image${i + 1}`;
      medical_documents[keyName] = documents[i].location;
    }
    const datetime = getCurrentDateInIST();

    const updatedata = await prisma.homeCare_Service.update({
      where: {
        id: id,
      },
      data: {
        // type,
        // mobility,
        patient_name,
        patient_mobility,
        patient_age,
        patient_gender,
        status:"requested",
        general_specialized,
        // contact_person_name,
        patient_contact_no,
        // assist_type,
        // location,
        // hospital_name,
        patient_location,
        // medication_records,
        start_date,
        // time,
        days_week,
        // hospital_location,
        // pickup_type,
        requirements,
        medical_documents: medical_documents,
      },
    });

    if (updatedata) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Requested successfully.",
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



module.exports = {
  addhospitalassistenquiry,
  addhospitalassist,
  gethospitalassistantreqs,
  physiotherapyenquiry,
  addphysiotherapy,
  getphysiotherapyreqs,
  addhomeServiceenquiry,
  addhomeservice
};
