const {
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
  decrypt,
} = require("../../utils");
require("dotenv").config();

// const addhospitalassistenquiry = async (request, response) => {
//   try {
//     const { customer_id, patient_name, patient_contact_no } = request.body;
//     const datetime = getCurrentDateInIST();
//     const find = await prisma.hospitalAssist_service.findFirst({
//       where: {
//         patient_name,
//         patient_contact_no,
//         customer_id,
//       },
//       select: {
//         id: true,
//         created_date: true,
//         status: true,
//       },
//     });
//     if (!find) {
//       const add = await prisma.hospitalAssist_service.create({
//         data: {
//           patient_name,
//           customer_id,
//           patient_contact_no,
//           status: "enquired",
//           created_date: datetime,
//         },
//       });
//       if (add) {
//         const adddata = {
//           id: add.id,
//         };
//         return response.status(200).json({
//           success: true,
//           error: false,
//           data: adddata,
//           message: "enquiry created successfully.",
//         });
//       }
//     } else {
//       return response.status(200).json({
//         success: true,
//         error: false,
//         data: find,
//         message: "enquiry created successfully.",
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in services-addhospitalassistenquiry API`
//     );
//     console.error(error);
//     response.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const addhospitalassistenquiry = async (request, response) => {
  try {
    const { customer_id, patient_name, patient_contact_no } = request.body;

    if (!patient_name || !patient_contact_no) {
      return response.status(400).json({
        success: false,
        error: true,
        message:
          "Missing required fields: patient_name, or patient_contact_no.",
      });
    }

    const datetime = getCurrentDateInIST();

    const createEnquiry = async () => {
      const newEnquiry = await prisma.hospitalAssist_service.create({
        data: {
          patient_name,
          patient_contact_no,
          customer_id,
          status: "enquired",
          created_date: datetime,
        },
      });
      return newEnquiry;
    };

    const find = await prisma.hospitalAssist_service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        status: {
          not: "placed",
        },
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });

    if (!find) {
      const newEnquiry = await createEnquiry();
      return response.status(200).json({
        success: true,
        error: false,
        data: { id: newEnquiry.id },
        message: "Enquiry created successfully.",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const createdDate = new Date(find.created_date).toISOString().split("T")[0];

    if (createdDate === today) {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "An enquiry already exists for today.",
      });
    }

    const newEnquiry = await createEnquiry();
    return response.status(200).json({
      success: true,
      error: false,
      data: { id: newEnquiry.id },
      message: "Enquiry created successfully.",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in addhospitalassistenquiry API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addhospitalassist = async (request, response) => {
  try {
    let {
      id,
      patient_mobility,
      patient_name,
      patient_age,
      patient_gender,
      hospital_name,
      patient_contact_no,
      patient_location,
      assist_type,
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
        mobility,
        patient_name,
        patient_mobility,
        patient_age,
        patient_gender,
        status: "placed",
        contact_person_name,
        patient_contact_no,
        assist_type,
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
        message: "Placed successfully.",
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

////////////service-admin///////////

const gethospitalassistantreqs = async (request, response) => {
  try {
    const allrequests = await prisma.hospitalAssist_service.findMany({
      where: {
        status: "placed",
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

const updatehospitalassistservice = async (request, response) => {
  const {
    id,
    patient_mobility,
    patient_name,
    patient_age,
    patient_gender,
    hospital_name,
    patient_location,
    assist_type,
    start_date,
    time,
    days_week,
    hospital_location,
    pickup_type,
    requirements,
  } = request.body;

  try {
    if (!id) {
      logger.error("id  is undefined in updatehospitalassistservice API");
      return response.status(400).json({
        error: true,
        message: "id  is required",
      });
    }

    const details = await prisma.hospitalAssist_service.update({
      where: {
        id: id,
      },
      data: {
        patient_name,
        patient_mobility,
        patient_gender,
        patient_age,
        assist_type,
        pickup_type,
        hospital_name,
        hospital_location,
        time,
        start_date,
        days_week,
        patient_location,
        requirements,
        medical_documents,
        price,
      },
    });
    if (!details) {
      response.status(400).json({
        success: false,
        message: "No data",
      });
    } else {
      response.status(200).json({
        success: true,
        message: "successfully updated",
        data: details,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-updatehospitalassistservice API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

////////physiotherapy//////////

const physiotherapyenquiry = async (request, response) => {
  try {
    const { customer_id, patient_name, patient_contact_no } = request.body;

    if (!patient_name || !patient_contact_no) {
      return response.status(400).json({
        success: false,
        error: true,
        message:
          "Missing required fields: patient_name, or patient_contact_no.",
      });
    }

    const datetime = getCurrentDateInIST();

    const createEnquiry = async () => {
      const newEnquiry = await prisma.physiotherapist_service.create({
        data: {
          patient_name,
          patient_contact_no,
          customer_id,
          status: "enquired",
          created_date: datetime,
        },
      });
      return newEnquiry;
    };

    const find = await prisma.physiotherapist_service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        status: {
          not: "placed",
        },
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });

    if (!find) {
      const newEnquiry = await createEnquiry();
      return response.status(200).json({
        success: true,
        error: false,
        data: { id: newEnquiry.id },
        message: "Enquiry created successfully.",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const createdDate = new Date(find.created_date).toISOString().split("T")[0];

    if (createdDate === today) {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "An enquiry already exists for today.",
      });
    }

    const newEnquiry = await createEnquiry();
    return response.status(200).json({
      success: true,
      error: false,
      data: { id: newEnquiry.id },
      message: "Enquiry created successfully.",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in physiotherapyenquiry API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addphysiotherapy = async (request, response) => {
  try {
    let {
      id,
      patient_name,
      patient_contact_no,
      patient_mobility,
      patient_gender,
      patient_age,
      start_date,
      days_week,
      general_specialized,
      patient_location,
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
        patient_name,
        patient_contact_no,
        patient_mobility,
        patient_gender,
        patient_age,
        start_date,
        days_week,
        general_specialized,
        patient_location,
        requirements,
        created_date: datetime,
        medical_documents: medical_documents,
        status: "placed",
      },
    });

    if (updatedata) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "placed successfully.",
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

////////service-admin/////////////

const getphysiotherapyreqs = async (request, response) => {
  try {
    const allrequests = await prisma.physiotherapist_service.findMany({
      where: {
        status: "placed",
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
      `Internal server error: ${error.message} in  getphysiotherapyreqs- getrequests API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const updatephysiotherapy = async (request, response) => {
  const {
    id,
    patient_name,
    patient_mobility,
    patient_gender,
    patient_age,
    start_date,
    days_week,
    general_specialized,
    patient_location,
    requirements,
  } = request.body;

  try {
    if (!id) {
      logger.error("id  is undefined in updatephysiotherapy API");
      return response.status(400).json({
        error: true,
        message: "id  is required",
      });
    }

    const details = await prisma.physiotherapist_service.update({
      where: {
        id: id,
      },
      data: {
        patient_name,
        patient_mobility,
        patient_gender,
        patient_age,
        start_date,
        days_week,
        general_specialized,
        patient_location,
        requirements,
      },
    });
    if (!details) {
      response.status(400).json({
        success: false,
        message: "No data",
      });
    } else {
      response.status(200).json({
        success: true,
        data: details,
        message: "successfully updated",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-updatephysiotherapy API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

//////home service///////

// const addhomeServiceenquiry = async (request, response) => {
//   try {
//     const { customer_id, patient_name, patient_contact_no } = request.body;
//     const datetime = getCurrentDateInIST();
//     const find = await prisma.homeCare_Service.findFirst({
//       where: {
//         patient_name,
//         patient_contact_no,
//         customer_id,
//       },
//       select: {
//         id: true,
//         created_date: true,
//         status: true,
//       },
//     });
//     if (!find) {
//       const add = await prisma.homeCare_Service.create({
//         data: {
//           patient_name,
//           patient_contact_no,
//           status: "enquired",
//           customer_id,
//           created_date: datetime,
//         },
//       });
//       if (add) {
//         const adddata = {
//           id: add.id,
//         };
//         return response.status(200).json({
//           success: true,
//           error: false,
//           data: adddata,
//           message: "enquiry created successfully.",
//         });
//       }
//     } else {
//       return response.status(200).json({
//         success: true,
//         error: false,
//         data: find,
//         message: "enquiry created successfully.",
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in services-addhomeServiceenquiry API`
//     );
//     console.error(error);
//     response.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const addhomeServiceenquiry = async (request, response) => {
  try {
    const { customer_id, patient_name, patient_contact_no } = request.body;

    if (!patient_name || !patient_contact_no) {
      return response.status(400).json({
        success: false,
        error: true,
        message:
          "Missing required fields: patient_name, or patient_contact_no.",
      });
    }

    const datetime = getCurrentDateInIST();

    const createEnquiry = async () => {
      const newEnquiry = await prisma.homeCare_Service.create({
        data: {
          patient_name,
          patient_contact_no,
          customer_id,
          status: "enquired",
          created_date: datetime,
        },
      });
      return newEnquiry;
    };

    const find = await prisma.homeCare_Service.findFirst({
      where: {
        patient_name,
        patient_contact_no,
        status: {
          not: "placed",
        },
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        id: true,
        created_date: true,
        status: true,
      },
    });

    if (!find) {
      const newEnquiry = await createEnquiry();
      return response.status(200).json({
        success: true,
        error: false,
        data: { id: newEnquiry.id },
        message: "Enquiry created successfully.",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const createdDate = new Date(find.created_date).toISOString().split("T")[0];

    if (createdDate === today) {
      return response.status(200).json({
        success: true,
        error: false,
        data: find,
        message: "An enquiry already exists for today.",
      });
    }

    const newEnquiry = await createEnquiry();
    return response.status(200).json({
      success: true,
      error: false,
      data: { id: newEnquiry.id },
      message: "Enquiry created successfully.",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in addhomeServiceenquiry API`
    );
    console.error(error);
    return response.status(500).json({ error: "Internal Server Error" });
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
        patient_name,
        patient_mobility,
        patient_age,
        patient_gender,
        status: "placed",
        general_specialized,
        patient_contact_no,
        patient_location,
        start_date,
        days_week,
        requirements,
        medical_documents: medical_documents,
      },
    });

    if (updatedata) {
      return response.status(200).json({
        success: true,
        error: false,
        message: "Placed successfully.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-addhomeservice API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};
//////////service-admin////////

const gethomeservicereqs = async (request, response) => {
  try {
    const allrequests = await prisma.homeCare_Service.findMany({
      where: {
        status: "placed",
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
      `Internal server error: ${error.message} in  gethomeservicereqs- getrequests API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const updatehomeservice = async (request, response) => {
  const {
    id,
    patient_mobility,
    patient_name,
    patient_age,
    patient_gender,
    patient_location,
    start_date,
    days_week,
    requirements,
    general_specialized,
  } = request.body;

  try {
    if (!id) {
      logger.error("id  is undefined in updatehomeservice API");
      return response.status(400).json({
        error: true,
        message: "id  is required",
      });
    }

    const details = await prisma.homeCare_Service.update({
      where: {
        id: id,
      },
      data: {
        id,
        patient_mobility,
        patient_name,
        patient_age,
        patient_gender,
        patient_location,
        start_date,
        days_week,
        requirements,
        general_specialized,
      },
    });
    if (!details) {
      response.status(400).json({
        success: false,
        message: "No data",
      });
    } else {
      response.status(200).json({
        message: "successfully updated",
        success: true,
        data: details,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-updatehomeservice API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

////////services-admin-common///////////////////////

const assistadd = async (request, response) => {
  const datetime = getCurrentDateInIST();

  try {
    const {
      name,
      phone_no,
      address,
      type,
      location,
      gender,
      dob,
      qualification,
      shift,
      password,
    } = request.body;

    if (!name || !phone_no || !address || !qualification || !gender) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.assist_details.findFirst({
      where: { phone_no },
    });

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }

    // Create a new pharmacy record
    const create = await prisma.assist_details.create({
      data: {
        name,
        phone_no,
        address,
        type,
        location,
        gender,
        dob,
        qualification,
        shift,
        password,
        created_date: datetime,
      },
    });

    if (create) {
      return response.status(200).json({
        message: "Successfully created",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in service-assistadd API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};
//get assists based on type//////////////
const getassists = async (request, response) => {
  const { type } = request.body;
  try {
    const allrequests = await prisma.assist_details.findMany({
      where: {
        type: type.toLowerCase(),
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
      `Internal server error: ${error.message} in  services- getassists API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

///////////get order dsetails based on type///////////
const getorderdetails = async (request, response) => {
  const { id, type } = request.body;
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    if (!id || !type) {
      logger.error("id and type is undefined in getCart API");
      return response.status(400).json({
        error: true,
        message: "id and type is required",
      });
    }
    if (type === "homecare_service") {
      const details = await prisma.homeCare_Service.findFirst({
        where: {
          id: id,
        },
        select: {
          patient_name: true,
          patient_contact_no: true,
          patient_mobility: true,
          patient_gender: true,
          patient_age: true,
          start_date: true,
          days_week: true,
          general_specialized: true,
          patient_location: true,
          requirements: true,
          medical_documents: true,
          price: true,
          created_date: true,
          assigned_date: true,
          status: true,
          users: {
            select: {
              name: true,
            },
          },
          assist_details: {
            select: {
              id: true,
              type: true,
              name: true,
              phone_no: true,
            },
          },
        },
      });
      if (!details) {
        response.status(400).json({
          success: false,
          message: "No data",
        });
      } else {
        const userName = details.users?.name
          ? decrypt(details.users.name, secretKey)
          : null;

        const responseBody = {
          ...details,
          users: {
            name: userName,
          },
        };
        response.status(200).json({
          success: true,
          data: responseBody,
        });
      }
    } else if (type === "physiotherapist_service") {
      const details = await prisma.physiotherapist_service.findFirst({
        where: {
          id: id,
        },
        select: {
          patient_name: true,
          patient_contact_no: true,
          patient_mobility: true,
          patient_gender: true,
          patient_age: true,
          start_date: true,
          days_week: true,
          general_specialized: true,
          patient_location: true,
          requirements: true,
          medical_documents: true,
          price: true,
          created_date: true,
          assigned_date: true,
          status: true,
          users: {
            select: {
              name: true,
            },
          },
          assist_details: {
            select: {
              id: true,
              type: true,
              name: true,
              phone_no: true,
            },
          },
        },
      });
      if (!details) {
        response.status(400).json({
          success: false,
          message: "No data",
        });
      } else {
        const userName = details.users?.name
          ? decrypt(details.users.name, secretKey)
          : null;

        const responseBody = {
          ...details,
          users: {
            name: userName,
          },
        };
        response.status(200).json({
          success: true,
          data: responseBody,
        });
      }
    } else if (type === "hospitalassist_service") {
      const details = await prisma.hospitalAssist_service.findFirst({
        where: {
          id: id,
        },
        select: {
          patient_name: true,
          patient_contact_no: true,
          patient_mobility: true,
          patient_gender: true,
          patient_age: true,
          assist_type: true,
          pickup_type: true,
          hospital_name: true,
          hospital_location: true,
          time: true,
          start_date: true,
          days_week: true,
          patient_location: true,
          requirements: true,
          medical_documents: true,
          price: true,
          created_date: true,
          assigned_date: true,
          status: true,
          users: {
            select: {
              name: true,
            },
          },
          assist_details: {
            select: {
              id: true,
              type: true,
              name: true,
              phone_no: true,
            },
          },
        },
      });
      if (!details) {
        response.status(400).json({
          success: false,
          message: "No data",
        });
      } else {
        const userName = details.users?.name
          ? decrypt(details.users.name, secretKey)
          : null;

        const responseBody = {
          ...details,
          users: {
            name: userName,
          },
        };
        response.status(200).json({
          success: true,
          data: responseBody,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-getorderdetails API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
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
  addhomeservice,
  gethomeservicereqs,
  assistadd,
  getassists,
  getorderdetails,
  updatehomeservice,
  updatephysiotherapy,
  updatehospitalassistservice,
};
