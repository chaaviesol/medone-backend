const {
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
  decrypt,
} = require("../../utils");
require("dotenv").config();
const bcrypt = require("bcrypt");
const admin = require("../../firebase");

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
    let requestData =
      typeof request.body.data === "string"
        ? JSON.parse(request.body.data)
        : request.body.data;
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
      end_date,
      time,
      days_week,
      hospital_location,
      pickup_type,
      requirements,
      customer_id,
      pincode,
    } = requestData;
    const documents = request.files;
    let medical_documents = {};

    // if (!documents || documents.length === 0) {
    //   return response.status(400).json({
    //     message: "Please attach at least one report",
    //     error: true,
    //   });
    // }

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
        patient_mobility,
        patient_name,
        patient_mobility,
        patient_age,
        patient_gender,
        status: "placed",
        patient_contact_no,
        assist_type,
        hospital_name,
        patient_location,
        start_date,
        end_date,
        time,
        days_week,
        customer_id,
        hospital_location,
        pickup_type,
        requirements,
        pincode,
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
    await prisma.$disconnect();
  }
};

////////////service-admin///////////

const gethospitalassistantreqs = async (request, response) => {
  try {
    const startTime = Date.now();
    logger.info("API gethospitalassistantreqs called");
    const allrequests = await prisma.hospitalAssist_service.findMany({
      orderBy: {
        created_date: "asc",
      },
    });
    if (allrequests.length > 0) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      logger.info(
        `Execution time for gethospitalassistantreqs API: ${executionTime}ms`
      );
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
    await prisma.$disconnect();
  }
};

const updatehospitalassistservice = async (request, response) => {
  console.log("nhhhhhhhhhhhh",request.body);
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
    end_date,
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
        end_date,
        days_week,
        patient_location,
        requirements,
        // medical_documents,
        // price,
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
    console.log("error-----", error);
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
      patient_gender,
      patient_age,
      start_date,
      prefered_time,
      patient_location,
      therapy_type,
      customer_id,
      pincode,
    } = request.body;

    const datetime = getCurrentDateInIST();

    const updatedata = await prisma.physiotherapist_service.update({
      where: {
        id: id,
      },
      data: {
        patient_name,
        patient_contact_no,
        patient_gender,
        prefered_time,
        patient_age,
        start_date,
        therapy_type,
        patient_location,
        pincode,
        created_date: datetime,
        status: "placed",
        customer_id,
      },
    });

    if (updatedata) {
      // const findUser = await prisma.user_details.findUnique({
      //   where: {
      //     id: customerId,
      //   },
      //   select: {
      //     token: true,
      //   },
      // });
      // console.log({ findUser });

      // const fcmToken = findUser.token;
      // console.log({ fcmToken });

      // const message = {
      //   notification: {
      //     title: "order received",
      //     body: "New order received.....❗",
      //     // sound: "msgsound"
      //   },
      //   token: fcmToken,
      // };
      // try {
      //   // await secondApp.messaging().send(message)
      //   await admin.messaging().send(message);
      //   console.log("Notification send Successfully");
      // } catch (err) {
      //   console.error({ err });
      // }
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
    const startTime = Date.now();
    logger.info("API getphysiotherapyreqs called");
    const allrequests = await prisma.physiotherapist_service.findMany({
      orderBy: {
        created_date: "asc",
      },
    });
    if (allrequests.length > 0) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      logger.info(
        `Execution time for getphysiotherapyreqs API: ${executionTime}ms`
      );
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
  console.log("reeeeeeeeeeee", request.body);
  const {
    id,
    patient_name,
    patient_gender,
    patient_age,
    start_date,
    patient_location,
    prefered_time,
    therapy_type,
    pincode,
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
        patient_gender,
        patient_age,
        prefered_time,
        start_date,
        therapy_type,
        pincode: parseInt(pincode),
        patient_location,
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
  console.log(request);
  try {
    let requestData =
      typeof request.body.data === "string"
        ? JSON.parse(request.body.data)
        : request.body.data;
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
      customer_id,
      pincode,
    } = requestData;

    const documents = request.files;
    let medical_documents = {};

    // if (!documents || documents.length === 0) {
    //   return response.status(400).json({
    //     message: "Please attach at least one report",
    //     error: true,
    //   });
    // }

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
        customer_id,
        pincode,
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
    const startTime = Date.now();
    logger.info("API gethomeservicereqs called");
    const allrequests = await prisma.homeCare_Service.findMany({
      orderBy: {
        created_date: "asc",
      },
    });
    if (allrequests.length > 0) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      logger.info(
        `Execution time for gethomeservicereqs API: ${executionTime}ms`
      );
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
  console.log(request.body);
  const {
    id,
    patient_mobility,
    patient_name,
    patient_age,
    patient_gender,
    patient_location,
    start_date,
    end_date,
    days_week,
    pincode,
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
        patient_mobility,
        patient_name,
        patient_age,
        patient_gender,
        patient_location,
        start_date,
        end_date,
        pincode: parseInt(pincode),
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
    console.log(error);
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
    const hashedPass = await bcrypt.hash(password, 5);
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
        password: hashedPass,
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
  const { type, id } = request.body;
  try {
    const allrequests = await prisma.assist_details.findMany({
      where: {
        type: type.toLowerCase(),
      },
    });

    if (type === "homecare_service") {
      const find = await prisma.homeCare_Service.findFirst({
        where: {
          id: id,
        },
        select: {
          assigned_date: true,
          assist_id: true,
          assist_details: {
            select: {
              name: true,
              type: true,
              gender: true,
              address: true,
            },
          },
        },
      });
      if (find.assist_id != null) {
        const responseby = {
          ...find,
          status: "assigned",
        };
        return response.status(200).json({
          data: responseby,
          success: true,
        });
      } else {
        if (allrequests.length > 0) {
          allrequests.forEach((element) => {
            element.status = "assign";
          });
          return response.status(200).json({
            data: allrequests,
            success: true,
          });
        }
      }
    } else if (type === "physiotherapist_service") {
      const find = await prisma.physiotherapist_service.findFirst({
        where: {
          id: id,
        },
        select: {
          assigned_date: true,
          assist_id: true,
          assist_details: {
            select: {
              name: true,
              type: true,
              gender: true,
              address: true,
            },
          },
        },
      });
      if (find.assist_id != null) {
        const responseby = {
          ...find,
          status: "assigned",
        };
        return response.status(200).json({
          data: responseby,
          success: true,
        });
      } else {
        if (allrequests.length > 0) {
          allrequests.forEach((element) => {
            element.status = "assign";
          });
          return response.status(200).json({
            data: allrequests,
            success: true,
          });
        }
      }
    } else if (type === "hospitalassist_service") {
      const find = await prisma.hospitalAssist_service.findFirst({
        where: {
          id: id,
        },
        select: {
          assigned_date: true,
          assist_id: true,
          assist_details: {
            select: {
              name: true,
              type: true,
              gender: true,
              address: true,
            },
          },
        },
      });
      if (find.assist_id != null) {
        const responseby = {
          ...find,
          status: "assigned",
        };
        return response.status(200).json({
          data: responseby,
          success: true,
        });
      } else {
        if (allrequests.length > 0) {
          allrequests.forEach((element) => {
            element.status = "assign";
          });
          return response.status(200).json({
            data: allrequests,
            success: true,
          });
        }
      }
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
    await prisma.$disconnect();
  }
};

///////////get order dsetails based on type///////////
const getorderdetails = async (request, response) => {
  const { id, type } = request.body;
  console.log("getorderdetailssssssssss", request.body);
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
          id: true,
          patient_name: true,
          patient_contact_no: true,
          patient_mobility: true,
          patient_gender: true,
          patient_age: true,
          start_date: true,
          end_date: true,
          days_week: true,
          general_specialized: true,
          patient_location: true,
          requirements: true,
          medical_documents: true,
          price: true,
          pincode: true,
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
          id: true,
          patient_name: true,
          patient_contact_no: true,
          patient_gender: true,
          patient_age: true,
          start_date: true,
          patient_location: true,
          prefered_time: true,
          price: true,
          pincode: true,
          created_date: true,
          therapy_type: true,
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
          id: true,
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
          end_date:true,
          days_week: true,
          patient_location: true,
          requirements: true,
          medical_documents: true,
          price: true,
          pincode: true,
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

// const assignassist = async (request, response) => {
//   console.log("rrrrrrrrrrrrrrrr", request.body);
//   try {
//     const { type, assist_id, id } = request.body;
//     const datetime = getCurrentDateInIST();
//     if (!type || !id || !assist_id) {
//       return response.status(400).json({
//         error: true,
//         message: "type and id can't be null or empty.",
//       });
//     }
//     let details = [];
//     if (type === "homecare_service") {
//       console.log("heyyyyyyyyyyyy");
//       details = await prisma.homeCare_Service.update({
//         where: {
//           id: id,
//         },
//         data: {
//           status: "confirmed",
//           assist_id: assist_id,
//           assigned_date: datetime,
//         },
//         select: {
//           customer_id: true,
//         },
//       });

//       response.status(200).json({
//         success: false,
//         message: "Assigned Successfully!!",
//         data: details,
//       });
//     } else if (type === "physiotherapist_service") {
//       details = await prisma.physiotherapist_service.update({
//         where: {
//           id: id,
//         },
//         data: {
//           status: "confirmed",
//           assist_id: assist_id,
//           assigned_date: datetime,
//         },
//         select: {
//           customer_id: true,
//         },
//       });

//       response.status(200).json({
//         success: false,
//         message: "Assigned Successfully!!",
//         data: details,
//       });
//     } else if (type === "hospitalassist_service") {
//       details = await prisma.hospitalAssist_service.update({
//         where: {
//           id: id,
//         },
//         data: {
//           status: "confirmed",
//           assist_id: assist_id,
//           assigned_date: datetime,
//         },
//         select: {
//           customer_id: true,
//         },
//       });

//       response.status(200).json({
//         success: false,
//         message: "Assigned Successfully!!",
//         data: details,
//       });
//     }

//     const customerId = details.customer_id ? details.customer_id : 10
//     console.log({ customerId });
//     ////findUser/////
//     const findUser = await prisma.user_details.findUnique({
//       where: {
//         id: customerId,
//       },
//       select: {
//         token: true,
//       },
//     });
//     console.log({ findUser });

//     const fcmToken = findUser.token;
//     console.log({ fcmToken });

//     const message = {
//       notification: {
//         title: "order received",
//         body: "New order received.....❗",
//         // sound: "msgsound"
//       },
//       token: fcmToken,
//     };
//     try {
//       // await secondApp.messaging().send(message)
//       await admin.messaging().send(message);
//       console.log("Notification send Successfully");
//     } catch (err) {
//       console.error({ err });
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in services-assit_assign API`
//     );
//     console.log(error);
//     response.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     //await prisma.$disconnect();
//   }
// };

const assignassist = async (request, response) => {
  console.log("Request received:", request.body);

  try {
    const { type, assist_id, id } = request.body;
    const datetime = getCurrentDateInIST();

    if (!type || !id || !assist_id) {
      return response.status(400).json({
        error: true,
        message: "type, id, and assist_id are required fields.",
      });
    }

    const serviceMap = {
      homecare_service: prisma.homeCare_Service,
      physiotherapist_service: prisma.physiotherapist_service,
      hospitalassist_service: prisma.hospitalAssist_service,
    };

    const service = serviceMap[type];

    if (!service) {
      return response.status(400).json({
        error: true,
        message: "Invalid service type.",
      });
    }

    const details = await service.update({
      where: { id },
      data: {
        status: "confirmed",
        assist_id,
        assigned_date: datetime,
      },
      select: { customer_id: true },
    });

    const customerId = details?.customer_id || 10;
    console.log("Customer ID:", customerId);

    const findUser = await prisma.user_details.findUnique({
      where: { id: customerId },
      select: { token: true },
    });

    const findAssitToken = await prisma.assist_details.findUnique({
      where: {
        id: assist_id,
      },
      select: {
        id: true,
        token: true,
      },
    });
    console.log({ findAssitToken });

    if (!findUser || !findUser.token) {
      console.warn("FCM Token not found for customer ID:", customerId);
    } else {
      const fcmToken = findUser.token;
      const message = {
        notification: {
          title: "Order Received",
          body: "New order received!",
        },
        token: fcmToken,
      };

      try {
        await admin.messaging().send(message);
        console.log("Notification sent successfully");
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    }

    if (!findAssitToken.token || !findAssitToken) {
      console.warn("FCM Token not found for customer ID:", assist_id);
    } else {
      const fcmToken = findAssitToken.token;
      const assistmessage = {
        notification: {
          title: "Task assigned",
          body: "New task assigned!",
        },
        token: fcmToken,
      };

      try {
        await admin.messaging().send(assistmessage);
        console.log("Notification sent successfully");
      } catch (err) {
        console.error("Error sending notification:", err);
      }
    }

    response.status(200).json({
      success: true,
      message: "Assigned successfully!",
      data: details,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services- assignassist API`
    );
    console.error("Internal server error:", error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const gethomecareassists = async (request, response) => {
  const { id } = request.body;
  try {
    const find = await prisma.homeCare_Service.findFirst({
      where: {
        id: id,
      },
      select: {
        general_specialized: true,
        pincode: true,
        assigned_date: true,
        start_date: true,
        end_date: true,
        assist_id: true,
        assist_details: {
          select: {
            name: true,
            type: true,
            gender: true,
            address: true,
            pincode:true,
            phone_no: true,
          },
        },
      },
    });

    if (!find) {
      return response.status(404).json({
        error: true,
        message: "Home care service not found",
      });
    }

    if (find.assist_id != null) {
      const responseby = [{
        gender:find?.assist_details?.gender,
        address:find?.assist_details?.address,
        pincode:find?.assist_details?.pincode,
        phone_no:find?.assist_details?.phone_no,
        type:find?.assist_details?.type,
        name:find?.assist_details?.name,
        button_status: "assigned",
      }];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      if (!find.start_date && !find.end_date) {
        return response.status(404).json({
          error: true,
          message: "Select start_date and end_date",
        });
      }

      const startDate = new Date(
        find.start_date.split("-").reverse().join("-")
      );
      const endDate = new Date(find.end_date.split("-").reverse().join("-"));
      const type = "nurse";
      const allassists = await prisma.assist_details.findMany({
        where: {
          type: type,
          general_specialized: find.general_specialized,
        },
        select: {
          id: true,
          name: true,
          type: true,
          gender: true,
          phone_no: true,
          address: true,
          pincode: true,
        },
      });

      if (allassists.length > 0) {
        allassists.forEach((element) => {
          element.button_status = "assign";
        });

        const availableNurses = [];
        for (const assist of allassists) {
          console.log({ assist });
          // Check for home care availability
          const homeCareAvailability = await prisma.homeCare_Service.findMany({
            where: {
              assist_id: assist.id,
              start_date: { gte: new Date(endDate).toISOString() },
              end_date: { lte: new Date(startDate).toISOString() },
            },
            select: {
              start_date: true,
              end_date: true,
            },
          });
          console.log({ homeCareAvailability });
          // Check for hospital assist availability
          const hospitalAssistAvailability =
            await prisma.hospitalAssist_service.findMany({
              where: {
                assist_id: assist.id,
                start_date: { gte: new Date(endDate).toISOString() },
                end_date: { lte: new Date(startDate).toISOString() },
              },
              select: {
                start_date: true,
                end_date: true,
              },
            });

          if (
            homeCareAvailability.length === 0 &&
            hospitalAssistAvailability.length === 0
          ) {
            availableNurses.push({
              ...assist,
              button_status: "assign",
            });
          }
        }

        if (availableNurses.length === 0) {
          return response.status(404).json({
            error: true,
            message: "No available nurses at the moment",
          });
        }

        // Sort the available nurses based on proximity to the given pincode
        function findNearestPinCodes(nurses, givenPincode, count = 8) {
          nurses.sort(
            (a, b) =>
              Math.abs(a.pincode - givenPincode) -
              Math.abs(b.pincode - givenPincode)
          );
          return nurses.slice(0, count);
        }

        const nearestassists = findNearestPinCodes(
          availableNurses,
          find.pincode
        );

        return response.status(200).json({
          data: nearestassists,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services- gethomecareassists API`
    );
    console.log(error);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getphysioassists = async (request, response) => {
  const { id } = request.body;
  try {
    if (!id) {
      return response.status(400).json({
        error: true,
        message: "id can't be null or empty.",
      });
    }
    const find = await prisma.physiotherapist_service.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        pincode: true,
        assigned_date: true,
        start_date: true,
        assist_id: true,
        therapy_type: true,
        assist_details: {
          select: {
            name: true,
            type: true,
            gender: true,
            address: true,
            pincode: true,
            phone_no: true,
          },
        },
      },
    });

    const type = "physiotherapist";
    const allassists = await prisma.assist_details.findMany({
      where: {
        type: type,
      },
      select: {
        id: true,
        name: true,
        type: true,
        gender: true,
        phone_no: true,
        address: true,
        pincode: true,
      },
    });

    if (find.assist_id != null) {
      const responseby = [{
        gender:find?.assist_details?.gender,
        address:find?.assist_details?.address,
        pincode:find?.assist_details?.pincode,
        phone_no:find?.assist_details?.phone_no,
        type:find?.assist_details?.type,
        name:find?.assist_details?.name,
        button_status: "assigned",
      }];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      if (allassists.length > 0) {
        allassists.forEach((element) => {
          element.button_status = "assign";
        });
        const givenPincode = find.pincode;
        function findNearestPinCodes(allassists, givenPincode, count = 10) {
          allassists.sort((a, b) => {
            return (
              Math.abs(a.pincode - givenPincode) -
              Math.abs(b.pincode - givenPincode)
            );
          });

          return allassists.slice(0, count);
        }

        const nearestPharmacies = findNearestPinCodes(allassists, givenPincode);

        return response.status(200).json({
          data: allassists,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in  services- getphysioassists API`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

// const gethospitalassists = async (request, response) => {
//   const { type, id } = request.body;
//   try {
//     const allrequests = await prisma.assist_details.findMany({
//       where: {
//         type: type.toLowerCase(),
//       },
//     });

//     if (type === "hospitalassist_service") {
//       const find = await prisma.hospitalAssist_service.findFirst({
//         where: {
//           id: id,
//         },
//         select: {
//           assigned_date: true,
//           assist_id: true,
//           assist_details: {
//             select: {
//               name: true,
//               type: true,
//               gender: true,
//               address: true,
//             },
//           },
//         },
//       });
//       if (find.assist_id != null) {
//         const responseby = {
//           ...find,
//           status: "assigned",
//         };
//         return response.status(200).json({
//           data: responseby,
//           success: true,
//         });
//       } else {
//         if (allrequests.length > 0) {
//           allrequests.forEach((element) => {
//             element.status = "assign";
//           });
//           return response.status(200).json({
//             data: allrequests,
//             success: true,
//           });
//         }
//       }
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in  services- getassists API`
//     );
//     response.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   } finally {
//     //await prisma.$disconnect();
//   }
// };

const gethospitalassists = async (request, response) => {
  const { id } = request.body;
  try {
    const find = await prisma.hospitalAssist_service.findFirst({
      where: {
        id: id,
      },
      select: {
        pincode: true,
        assigned_date: true,
        start_date: true,
        end_date: true,
        assist_id: true,
        assist_details: {
          select: {
            name: true,
            type: true,
            gender: true,
            address: true,
            pincode:true,
            phone_no:true
          },
        },
      },
    });

    if (!find) {
      return response.status(404).json({
        error: true,
        message: "Hospital Assist service not found",
      });
    }

    if (find.assist_id != null) {
      const responseby = [{
        gender:find?.assist_details?.gender,
        address:find?.assist_details?.address,
        pincode:find?.assist_details?.pincode,
        phone_no:find?.assist_details?.phone_no,
        type:find?.assist_details?.type,
        name:find?.assist_details?.name,
        button_status: "assigned",
      }];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      if (!find.start_date && !find.end_date) {
        return response.status(404).json({
          error: true,
          message: "Select start_date and end_date",
        });
      }

      const startDate = new Date(
        find.start_date.split("-").reverse().join("-")
      );
      const endDate = new Date(find.end_date.split("-").reverse().join("-"));
      const type = "nurse";
      const general_specialized = "general";
      const allassists = await prisma.assist_details.findMany({
        where: {
          type: type,
          general_specialized: general_specialized,
        },
        select: {
          id: true,
          name: true,
          type: true,
          gender: true,
          phone_no: true,
          address: true,
          pincode: true,
        },
      });

      if (allassists.length > 0) {
        allassists.forEach((element) => {
          element.button_status = "assign";
        });

        const availableNurses = [];
        for (const assist of allassists) {
          const homeCareAvailability = await prisma.homeCare_Service.findMany({
            where: {
              assist_id: assist.id,
              start_date: { gte: new Date(endDate).toISOString() },
              end_date: { lte: new Date(startDate).toISOString() },
            },
            select: {
              start_date: true,
              end_date: true,
            },
          });
        
          // Check for hospital assist availability
          const hospitalAssistAvailability =
            await prisma.hospitalAssist_service.findMany({
              where: {
                assist_id: assist.id,
                start_date: { gte: new Date(endDate).toISOString() },
                end_date: { lte: new Date(startDate).toISOString() },
              },
              select: {
                start_date: true,
                end_date: true,
              },
            });

          
          if (
            homeCareAvailability.length === 0 &&
            hospitalAssistAvailability.length === 0
          ) {
            availableNurses.push({
              ...assist,
              button_status: "assign",
            });
          }
        }
       
        if (availableNurses.length === 0) {
          return response.status(404).json({
            error: true,
            message: "No available nurses at the moment",
          });
        }

        function findNearestPinCodes(nurses, givenPincode, count = 8) {
          nurses.sort(
            (a, b) =>
              Math.abs(a.pincode - givenPincode) -
              Math.abs(b.pincode - givenPincode)
          );
          return nurses.slice(0, count);
        }

        const nearestassists = findNearestPinCodes(
          availableNurses,
          find.pincode
        );
        console.log({ nearestassists });
        return response.status(200).json({
          data: nearestassists,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services- gethospitalassists API`
    );
    console.log(error);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const allassists = async (request, response) => {
  try {
    const { id } = request.body;
    const datetime = getCurrentDateInIST();
    if (!id) {
      return response.status(400).json({
        error: true,
        message: "type and id can't be null or empty.",
      });
    }
    const find = await prisma.homeCare_Service.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        general_specialized: true,
        pincode: true,
        assigned_date: true,
        start_date: true,
        end_date: true,
        assist_id: true,
        assist_details: {
          select: {
            name: true,
            type: true,
            gender: true,
            address: true,
            pincode: true,
            phone_no: true,
          },
        },
      },
    });
    // console.log({ find });
    let general_special;
    general_special = find.general_specialized
      ? find.general_specialized
      : "general";
    // console.log(general_special);
    const type = "nurse";
    const allassists = await prisma.assist_details.findMany({
      where: {
        type: type,
        general_specialized: general_special,
      },
      select: {
        id: true,
        name: true,
        type: true,
        gender: true,
        phone_no: true,
        address: true,
        pincode: true,
      },
    });
    if (find.assist_id != null) {
      const responseby = [
        {
          ...find.assist_details,
          button_status: "assigned",
        },
      ];
      return response.status(200).json({
        data: responseby,
        success: true,
      });
    } else {
      console.log({ allassists });
      if (allassists.length > 0) {
        allassists.forEach((element) => {
          element.button_status = "assign";
        });
        return response.status(200).json({
          data: allassists,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-assit_assign API`
    );
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const priceadd = async (request, response) => {
  console.log("rrrrrrrrrrrrrrrr", request.body);
  try {
    const { type, id, price } = request.body;
    const datetime = getCurrentDateInIST();
    if (!type || !id) {
      return response.status(400).json({
        error: true,
        message: "type and id can't be null or empty.",
      });
    }
    if (type === "homecare_service") {
      console.log("heyyyyyyyyyyyy");
      const details = await prisma.homeCare_Service.update({
        where: {
          id: id,
        },
        data: {
          price: price,
        },
      });

      response.status(200).json({
        success: true,
        message: "Price added Successfully!!",
      });
    } else if (type === "physiotherapist_service") {
      const details = await prisma.physiotherapist_service.update({
        where: {
          id: id,
        },
        data: {
          price: price,
        },
      });

      response.status(200).json({
        success: true,
        message: "Price added Successfully!!",
      });
    } else if (type === "hospitalassist_service") {
      const details = await prisma.hospitalAssist_service.update({
        where: {
          id: id,
        },
        data: {
          price: price,
        },
      });

      response.status(200).json({
        success: true,
        message: "Price added Successfully!!",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in services-assit_assign API`
    );
    console.log(error);
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
  addhomeservice,
  gethomeservicereqs,
  assistadd,
  getassists,
  getorderdetails,
  updatehomeservice,
  updatephysiotherapy,
  updatehospitalassistservice,
  assignassist,
  gethomecareassists,
  allassists,
  priceadd,
  getphysioassists,
  gethospitalassists,
};
