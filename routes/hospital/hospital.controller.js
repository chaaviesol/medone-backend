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

//registration of hospitals
const hospital_registration = async (req, res) => {
  const {
    name,
    address,
    lisence_no,
    features,
    focusarea,
    specialties,
    password,
    contact_no,
    onlinebooking,
    about,
    pincode,
    type,
    email,
  } = JSON.parse(req.body.data);
  const date = new Date();
  const datetime = getCurrentDateInIST();
  try {
    const hospital_image = req.files;
    let hospitalImage = {};

    for (i = 0; i < hospital_image?.length; i++) {
      let keyName = `image${i + 1}`;

      hospitalImage[keyName] = hospital_image[i].location;
    }
    const emaillower = email.toLowerCase();

    // Check if email already exists
    const checkEmail = await prisma.hospital_details.findFirst({
      where: {
        email: emaillower,
      },
    });

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.hospital_details.findFirst({
      where: { contact_no: contact_no },
    });
    const checklicense_no = await prisma.hospital_details.findFirst({
      where: { licence_no: lisence_no },
    });
    if (checkEmail) {
      return response.status(400).json({
        message: "Email ID already exists",
        error: true,
      });
    }

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }
    if (checklicense_no) {
      return response.status(400).json({
        message: "license number already exists",
        error: true,
      });
    }
    // const hospital = await prisma.hospital_details.findMany({
    //   where: {
    //     OR: [{ email: email }, { contact_no: contact_no },{
    //       licence_no:lisence_no
    //     }],
    //   },
    // });
    // if (hospital.length > 0) {
    //   const resptext = "Email, phone number or lisence number already exists";
    //   return res.status(400).json({
    //     error: true,
    //     message: resptext,
    //   });
    // } else {
    const hashedpassword = await bcrypt.hash(password, 10);
    const register_data = await prisma.hospital_details.create({
      data: {
        name: name,
        address: address,
        licence_no: lisence_no,
        feature: features,
        photo: hospitalImage,
        speciality: specialties,
        contact_no: contact_no,
        onlinebooking: onlinebooking,
        datetime: datetime,
        password: hashedpassword,
        email: emaillower,
        focusarea: focusarea,
        about: about,
        type: type,
        pincode: parseInt(pincode),
        status: "P",
      },
    });
    // const add = await prisma.adm_notification.create({
    //   data: {
    //     sender: register_data?.id,
    //     type: "Hospital",
    //     read: "N",
    //     text: "Hospital successfully registered",
    //     created_date: datetime
    //   },
    // })
    res.status(200).json({
      error: false,
      success: true,
      message: "successfully completed the registration",
      data: register_data,
    });
    // }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital_registration api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  }
};

//login for hospitals

const hospital_login = async (req, res) => {
  const { userid, password } = req.body;
  if (!userid || !password) {
    res.status(400).json({
      error: true,
      message: "userid and password are required",
    });
  } else {
    try {
      let user;
      let identifier;

      const emailformat = /^[^\s@]+@gmail\.com$/.test(userid);
      if (emailformat) {
        identifier = "email";
      } else {
        identifier = "mobile";
      }
      if (identifier === "email") {
        user = await prisma.hospital_details.findFirst({
          where: {
            email: userid,
          },
        });
      } else {
        user = await prisma.hospital_details.findFirst({
          where: {
            phone_no: userid,
          },
        });
      }
      if (!user) {
        res.status(400).json({
          error: true,
          message: "user not found",
        });
      } else {
        const hashedpassword = user.password;
        bcrypt.compare(password, hashedpassword, function (err, result) {
          if (err) {
            res.status(500).json({
              error: true,
              message: "password hashing error",
            });
          } else {
            if (!result) {
              res.status(400).json({
                error: false,
                message: "invaild password",
              });
            } else {
              res.status(200).json({
                error: false,
                success: true,
                message: "successfully logged in",
                data: user,
              });
            }
          }
        });
      }
    } catch (err) {
      logger.error(
        `Internal server error: ${err.message} in hospital_login api`
      );
      res.status(400).json({
        error: true,
        message: "internal server error",
      });
    }
  }
};

// to get the complete hospital list

const get_hospital = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  // Helper function to handle decryption with fallback
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text; // Return the original text if decryption fails
    }
  };

  try {
    const complete_hospital = await prisma.hospital_details.findMany({
      where: {
        OR: [{ status: "Y" }, { status: null }],
        NOT: {
          name: {
            contains: "Residential",
          },
        },
      },
      orderBy: {
        // datetime: "desc",
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        address: true,
        licence_no: true,
        rating: true,
        feature: true,
        datetime: true,
        photo: true,
        speciality: true,
        contact_no: true,
        type: true,
        pincode: true,
        about: true,
        email: true,
        last_active: true,
        status: true,
      },
    });

    const decrypted_data = complete_hospital.map((hospital) => {
      return {
        ...hospital,
        email: safeDecrypt(hospital.email, secretKey),
        // phone_no: safeDecrypt(hospital?.contact_no, secretKey),
        licence_no: safeDecrypt(hospital?.licence_no, secretKey),
      };
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successful",
      data: decrypted_data,
    });
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in get_hospital api`);
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

//to edit the hospital profile

const edit_hospital = async (req, res) => {
  try {
    const { hospital_id, about } = req.body;
    const datetime = getCurrentDateInIST();
    const edited_details = await prisma.hospital_details.update({
      where: {
        id: hospital_id,
      },
      data: {
        about: about,
        updatedDate: datetime,
      },
    });
    if (edited_details) {
      res.status(200).json({
        error: false,
        success: true,
        message: "successfully edited the details",
      });
    }
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in edit_hospital api`);
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};
//admin editing the hospital details
const editbyadmin = async (req, res) => {
  const datetime = getCurrentDateInIST();
  try {
    const {
      hospital_id,
      name,
      address,
      lisence_no,
      feature,
      photo,
      speciality,
      focusarea,
      contact_no,
      onlinebooking,
    } = req.body;

    const edited_details = await prisma.hospital_details.update({
      where: {
        id: hospital_id,
      },
      data: {
        name: name,
        address: address,
        lisence_no: lisence_no,
        fearture: feature,
        photo: photo,
        speciality: speciality,
        focusarea: focusarea,
        contact_no: contact_no,
        onlinebooking: onlinebooking,
        updatedDate: datetime,
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully edited the details",
      data: edited_details,
    });
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in edit_hospital api`);
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

const completeedit = async (req, res) => {
  const datetime = getCurrentDateInIST();

  try {
    const {
      id,
      name,
      address,
      licence_no,
      features,
      photo,
      specialties,
      focusarea,
      password,
      contact_no,
      onlinebooking,
      about,
      pincode,
      type,
      email,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Hospital ID is required",
        error: true,
      });
    }

    const find = await prisma.hospital_details.findFirst({
      where: {
        id: id,
      },
    });

    if (!find) {
      return res.status(404).json({
        message: "Hospital not found",
        error: true,
      });
    }

    // Validation functions
    const validateMobileNumber = (mobileNumber) => {
      const mobileNumberRegex = /^[6-9]\d{9}$/;
      return mobileNumberRegex.test(mobileNumber);
    };

    const validateEmail = (email_id) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email_id);
    };

    // Track which fields are being updated
    let updateFields = [];

    // Check if contact_no, email, or lisence_no has changed
    const checkChanges = (field, newValue) => {
      if (newValue && find[field] !== newValue) {
        updateFields.push(field);
        return newValue;
      }
      return find[field];
    };

    const skipEmailCheck = find.email === email;
    const skipPhoneCheck = find.contact_no === contact_no;
    const skipLicenseCheck = find.licence_no === licence_no;

    if (!skipPhoneCheck && contact_no) {
      if (!validateMobileNumber(contact_no)) {
        return res.status(400).json({
          message: "Invalid mobile number",
          error: true,
        });
      }
    }

    if (!skipEmailCheck && email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          message: "Invalid email address",
          error: true,
        });
      }
    }

    if (
      (!skipEmailCheck && email) ||
      (!skipPhoneCheck && contact_no) ||
      (!skipLicenseCheck && licence_no)
    ) {
      const hospitals = await prisma.hospital_details.findMany({
        where: {
          OR: [
            { email: skipEmailCheck ? undefined : email },
            { contact_no: skipPhoneCheck ? undefined : contact_no },
            { lisence_no: skipLicenseCheck ? undefined : licence_no },
          ],
        },
      });

      if (hospitals.length > 0) {
        return res.status(400).json({
          error: true,
          message: "Email, phone number, or license number already exists",
          success: false,
        });
      }
    }

    const updateData = {
      name: checkChanges("name", name),
      address: checkChanges("address", address),
      licence_no: checkChanges("licence_no", licence_no),
      features: checkChanges("features", features),
      photo: checkChanges("photo", photo),
      specialties: checkChanges("specialties", specialties),
      password: checkChanges("password", password), // If you need to hash the password, include the hashing logic
      contact_no: checkChanges("contact_no", contact_no),
      onlinebooking: checkChanges("onlinebooking", onlinebooking),
      about: checkChanges("about", about),
      pincode: checkChanges("pincode", pincode),
      type: checkChanges("type", type),
      email: checkChanges("email", email),
      updatedDate: datetime,
      focusarea: checkChanges("focusarea", focusarea),
    };

    // Remove unchanged fields from updateData
    Object.keys(updateData).forEach(
      (key) => updateData[key] === find[key] && delete updateData[key]
    );

    const edited_data = await prisma.hospital_details.update({
      where: { id: id },
      data: updateData,
    });

    if (edited_data && updateFields.length > 0) {
      const text = `Successfully updated your ${updateFields.join(", ")}.`;
      await prisma.adm_notification.create({
        data: {
          sender: id,
          type: "Hospital",
          read: "N",
          text: text,
          created_date: datetime,
        },
      });
      return res.status(200).json({
        error: false,
        success: true,
        message: "Successfully edited the details",
        data: edited_data,
      });
    } else {
      return res.status(200).json({
        error: true,
        success: false,
        message: "No data to update.",
        data: edited_data,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital completeedit API`
    );

    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const delete_hospital = async (req, res) => {
  try {
    const { hospital_id } = req.body;
    const deleted_data = await prisma.hospital_details.delete({
      where: {
        id: hospital_id,
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully deleted the data",
      data: deleted_data,
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in delete_hospital api`
    );
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

//adding doctor by hospital
const add_doctor = async (req, res) => {
  try {
    const docImageLink = req?.file?.location;
    const secretKey = process.env.ENCRYPTION_KEY;
    const datetime = getCurrentDateInIST();
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const {
      name,
      second_name,
      email,
      about,
      phone_no,
      qualification,
      gender,
      type,
      experience,
      registration_no,
      specialization,
      hospital_id,
    } = JSON.parse(req.body.data);
    // JSON.parse(req.body.data);
    const mobileNumber = phone_no;
    if (validateMobileNumber(mobileNumber)) {
      console.log("Valid mobile number");
    } else {
      console.log("Invalid mobile number");
      const resptext = "Invalid mobile number";
      return res.send(resptext);
    }
    function validateMobileNumber(mobileNumber) {
      // Regular expression for a valid 10-digit Indian mobile number
      const mobileNumberRegex = /^[6-9]\d{9}$/;
      return mobileNumberRegex.test(mobileNumber);
    }
    const email_id = email;
    if (validateEmail(email_id)) {
      console.log("Valid email address");
    } else {
      console.log("Invalid email address");
      const resptext = "Invalid email address";
      return res.send(resptext);
    }
    function validateEmail(email_id) {
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailRegex = /^[^\s@]+/;

      return emailRegex.test(email_id);
    }
    const capitalizeFirstLetter = (string) => {
      const prefix = "Dr.";
      const nameWithoutPrefix = string.startsWith(prefix)
        ? string.slice(prefix.length)
        : string;
      return (
        prefix +
        nameWithoutPrefix.charAt(0).toUpperCase() +
        nameWithoutPrefix.slice(1)
      );
    };
    const doctor = await prisma.doctor_details.findFirst({
      where: {
        email: email,
      },
    });
    if (doctor) {
      return res.status(400).json({
        message: "email id already exists",
        error: true,
      });
    }
    const doctors = await prisma.doctor_details.findMany();

    for (const doctor of doctors) {
      // const decryptedEmail = safeDecrypt(doctor.email, secretKey);

      const decryptedPhone = safeDecrypt(doctor.phone_no, secretKey);
      const decryptedregistration_no = safeDecrypt(
        doctor.registration_no,
        secretKey
      );

      if (
        decryptedPhone === phone_no ||
        decryptedregistration_no == registration_no
      ) {
        return res.status(400).json({
          error: true,
          message: "Phone number or register number already exists",
          success: false,
        });
      }
    }
    const capitalised_name = capitalizeFirstLetter(name);
    // const hashedpassword = await bcrypt.hash(password, 10);
    const encryptedPhone = encrypt(phone_no, secretKey);
    // const encryptedEmail = encrypt(email, secretKey);
    const encryptedRegistrationNo = encrypt(registration_no, secretKey);

    const added_doctorData = await prisma.doctor_details.create({
      data: {
        name: capitalised_name,
        second_name: second_name,
        image: docImageLink,
        email: email,
        about: about,
        phone_no: encryptedPhone,
        education_qualification: qualification,
        gender: gender,
        type: type,
        experience: experience,
        registration_no: encryptedRegistrationNo,
        specialization: specialization,
        datetime: datetime,
        status: "P",
      },
    });

    const doctor_id = added_doctorData.id;

    // const days = [
    //   {
    //     id: 1,
    //     day: "Sunday",
    //     availableTimes: [
    //       {
    //         endTime: "2024-03-26T21:30:00.000Z",
    //         startTime: "2024-03-26T21:30:00.000Z",
    //       },
    //     ],
    //   },
    //   {
    //     id: 2,
    //     day: "Monday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    //   {
    //     id: 3,
    //     day: "Tuesday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    //   {
    //     id: 4,
    //     day: "Wednesday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    //   {
    //     id: 5,
    //     day: "Thursday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    //   {
    //     id: 6,
    //     day: "Friday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    //   {
    //     id: 7,
    //     day: "Saturday",
    //     availableTimes: [
    //       {
    //         endTime: "",
    //         startTime: "",
    //       },
    //     ],
    //   },
    // ];
    // const isAnyAvailableTimesExist = days.some(
    //   (ele) => ele.availableTimes[0].startTime && ele.availableTimes[0].endTime
    // );
    // if (isAnyAvailableTimesExist === true) {

    const hospital_doctor = await prisma.doctor_hospital.create({
      data: {
        hospital_id: hospital_id,
        doctor_id: doctor_id,
        datetime: datetime,
        // days_timing: days,
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfully added the doctor",
      data: {
        added_doctorData: added_doctorData,
        hospital_doctor: hospital_doctor,
      },
    });
    // }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital doctor api`
    );
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

//adding the timing of the doctors by hospital
const consultation_data = async (req, res) => {
  try {
    const { doctor_id, days, hospital_id } = req.body;
    const datetime = getCurrentDateInIST();
    if (!doctor_id) {
      return res.status(404).json({
        message: "Required fields can't be null",
        error: true,
        success: false,
      });
    }
    const hospitalid = hospital_id ? hospital_id : 1; //24 //2962
    const check = await prisma.doctor_hospital.findFirst({
      where: {
        doctor_id: doctor_id,
        hospital_id: hospitalid,
      },
    });
    if (check) {
      return res.status(400).json({
        message: "This relation already exists",
        error: true,
      });
    }

    const isAnyAvailableTimesExist = days.some(
      (ele) => ele.availableTimes[0].startTime && ele.availableTimes[0].endTime
    );
    if (isAnyAvailableTimesExist === true) {
      let data = {
        doctor_id: doctor_id,
        datetime: datetime,
        days_timing: days,
        hospital_id: hospitalid,
      };

      // if (hospital_id) {
      //   data.hospital_id = hospital_id;
      // }

      const add_consultingDay = await prisma.doctor_hospital.create({
        data: data,
      });

      res.status(200).json({
        error: false,
        success: true,
        message: "successfully added the consultation details",
        data: add_consultingDay,
      });
    } else {
      res.status(400).json({
        error: true,
        success: false,
        message: "Available time is not provided",
      });
    }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital consultation_data api`
    );
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

//for filtering using the name of the hospital
const filter_byName = async (req, res) => {
  try {
    const { name } = req.body;
    const lowercaseName = name.toLowerCase();
    const filter_data = await prisma.hospital_details.findMany({
      where: {
        name: {
          startsWith: lowercaseName,
          mode: "insensitive",
        },
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: filter_data,
    });
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in filter_byName api`);
    res.status(200).json({
      error: true,
      message: "internal server error",
    });
  }
};

//hospital filter using the various parameter
const hospital_filter = async (req, res) => {
  try {
    const { medical_field, speciality, feature, focusarea } = req.body;
    let hospitalFilter;

    if (medical_field && speciality && feature && focusarea) {
      hospitalFilter = await prisma.hospital_details.findMany({
        where: {
          type: medical_field,
          speciality: speciality,
          feature: feature,
        },
        orderBy: {
          name: "asc",
        },
      });
    } else {
      let hospitalfilterData = {};
      if (medical_field) {
        hospitalfilterData.type = medical_field;
      }
      if (speciality) {
        hospitalfilterData.speciality = speciality;
      }
      if (feature) {
        hospitalfilterData.feature = feature;
      }
      if (focusarea) {
        hospitalfilterData.focusarea = focusarea;
      }
      hospitalFilter = await prisma.hospital_details.findMany({
        where: {
          hospitalfilterData,
        },
        orderBy: {
          name: "asc",
        },
      });
    }

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully",
      data: hospitalFilter,
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital_filter api`
    );
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};

//for getting the address

const getHospitalAddress = async (req, res) => {
  const { id } = req.body;

  try {
    const addressData = await prisma.hospital_details.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        address: true,
      },
    });
    if (!addressData) {
      return res.status(400).json({
        message: "no data found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      data: addressData,
      message: "Data fetched successfully",
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in getHospitalAddress api`
    );
    res.status(400).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//for getting the hospital in the searched area
const get_hospitalBypin = async (req, res) => {
  try {
    const { selectedArea_id } = req.body;

    const get_postalData = await prisma.pincode_data.findMany({
      where: {
        id: selectedArea_id,
      },
    });

    const result = get_postalData[0].pincode;
    const get_doctorDetails = await prisma.hospital_details.findMany({
      where: {
        pincode: result,
      },
      orderBy: {
        name: "asc",
      },
    });
    let featured_partner = [];
    let not_featured_partner = [];
    if (get_doctorDetails.length > 0) {
      for (i = 0; i < get_doctorDetails.length; i++) {
        if (get_doctorDetails[i].featured_partner === true) {
          featured_partner.push(get_doctorDetails[i]);
        } else {
          not_featured_partner.push(get_doctorDetails[i]);
        }
      }
      return res.status(200).json({
        error: false,
        success: true,
        message: "successfull",
        data: [...featured_partner, ...not_featured_partner],
      });
    }
    let nearByData = [];
    let nearBy_notfeatured = [];
    let samePinData = [];
    let nearByData_featured = [];
    if (get_doctorDetails.length === 0) {
      let suggestedpincodes = [
        result - 1,
        result + 1,
        result - 2,
        result + 2,
        result - 3,
        result + 3,
        result - 4,
        result + 4,
      ];
      // for(let i=result-4; i<=result+4; i++){
      //     suggestedpincodes.push(i)
      // }

      for (i = 0; i < suggestedpincodes.length; i++) {
        const nearBypincode = await prisma.hospital_details.findMany({
          where: {
            pincode: suggestedpincodes[i],
          },
          orderBy: {
            name: "asc",
          },
        });
        if (nearBypincode.length > 0) {
          for (j = 0; j < nearBypincode.length; j++) {
            if (nearBypincode[j].featured_partner === true) {
              nearByData.push(nearBypincode[j]);
            } else {
              nearBy_notfeatured.push(nearBypincode[j]);
            }
          }

          samePinData = [...nearByData, ...nearBy_notfeatured];

          for (k = 0; k < samePinData.length; k++) {
            nearByData_featured.push(samePinData[k]);
          }
          nearByData = [];
          nearBy_notfeatured = [];
        }
        //  ggg.push(samePinData)

        if (nearByData_featured.length > 0) {
          return res.status(200).json({
            error: false,
            success: true,
            message: "successfull",
            data: nearByData_featured,
          });
        } else {
          return res.status(400).json({
            error: true,
            success: false,
            message: "No data found",
          });
        }
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: nearByData_featured,
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in get_hospitalBypin api`
    );
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//getting the consultation details of a doctor
const doctor_consultationList = async (req, res) => {
  try {
    const doctor_id = req.body.id;
    if (!doctor_id) {
      return res.status(400).json({
        message: "no doc id found",
        error: true,
        success: false,
      });
    }
    const get_consultationList = await prisma.doctor_hospital.findMany({
      where: {
        doctor_id: doctor_id,
      },
      orderBy: {
        datetime: "desc",
      },
      include: {
        doctorId: {
          select: {
            address: true,
          },
        },

        // hospitalid:true
      },
    });

    if (get_consultationList.length > 0) {
      const consultationListWithHospitals = await Promise.all(
        get_consultationList.map(async (item) => {
          const hospitalData = await prisma.hospital_details.findUnique({
            where: {
              id: item?.hospital_id,
            },
          });
          let hospitalName = hospitalData
            ? hospitalData.name
            : "Hospital Name Not Found";
          let hospitalAddress = hospitalData ? hospitalData.address : null;
          let contact_no = hospitalData ? hospitalData.contact_no : null;
          // Check if hospital name is 'residential' and address is null
          if (
            hospitalName.toLowerCase() === "residential" &&
            !hospitalAddress
          ) {
            hospitalAddress = item.doctorId?.address;
          }

          if (hospitalName.toLowerCase() === "residential" && !contact_no) {
            contact_no = item.doctorId.phone_office;
          }

          return {
            ...item,
            hospital_name: hospitalName,
            hospitaladdrress: hospitalAddress,
            contactNumber: contact_no,
          };

          // return {
          //   ...item,
          //   hospital_name: hospitalData
          //     ? hospitalData.name
          //     : "Hospital Name Not Found",
          //   hospitaladdrress: hospitalData
          //     ? hospitalData.address
          //     : item.doctorId?.address,
          // };
        })
      );

      if (consultationListWithHospitals) {
        return res.status(200).json({
          success: true,
          message: "Successfull",
          data: consultationListWithHospitals,
        });
      }
    } else {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Doctor consultation list not found for the given doctor ID",
      });
    }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital doctor_consultationList api`
    );
    return res.status(400).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//editing the consultation details
const edit_consultation = async (req, res) => {
  try {
    const datetime = getCurrentDateInIST();
    const { id, days_timing } = req.body;
    const edited_data = await prisma.doctor_hospital.update({
      where: {
        id: id, //doctor-hospital db id
      },
      data: {
        days_timing: days_timing,
        updated_date: datetime,
      },
    });
    if (edited_data) {
      res.status(200).json({
        error: false,
        success: true,
        message: "successfully edited the data",
        data: edited_data,
      });
    }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in hospital edit_consultation api`
    );
    res.status(400).json({
      error: true,
      success: false,
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//for deleting the availability
const delete_availability = async (req, res) => {
  try {
    const { id } = req.body; //doctor_hospital table id

    const delete_details = await prisma.doctor_hospital.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "Successfully deleted",
      data: delete_details,
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in delete_availability api`
    );
    res.status(400).json({
      error: true,
      message: "internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const getDoctorList = async (req, res) => {
  try {
    const hospitalId = req.body.id;
    const doctorList = await prisma.doctor_hospital.findMany({
      where: {
        hospital_id: hospitalId,
      },
      select: {
        doctor_id: true,
      },
    });
    const doctorIds = doctorList.map((ele) => {
      return ele.doctor_id;
    });

    let doctorDatas = [];
    for (let i = 0; i < doctorIds.length; i++) {
      const doctorsDetails = await prisma.doctor_details.findMany({
        where: {
          id: doctorIds[i],
        },
        select: {
          id: true,
          name: true,
          phone_no: true,
          email: true,
          image: true,
        },
      });
      doctorDatas.push(doctorsDetails[0]);
    }
    res.status(200).json({
      success: true,
      error: false,
      data: doctorDatas,
    });
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in getDoctorList api`);
    res.status(400).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const get_hospitalDetails = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  try {
    const { id } = req.body;
    const find = await prisma.hospital_details.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        rating: true,
        licence_no: true,
        feature: true,
        datetime: true,
        speciality: true,
        contact_no: true,
        type: true,
        pincode: true,
        about: true,
        email: true,
        last_active: true,
        status: true,
      },
    });

    if (find) {
      if (find.status !== "Y") {
        return response.status(404).json({
          success: false,
          message:
            "Approval is pending for your account. Thank you for your patience.",
          error: true,
        });
      }
      // Decrypting sensitive data
      // const decryptedPhone = decrypt(find.phone_no, secretKey);
      // const decryptedEmail = decrypt(find.email, secretKey);
      // const decryptedRegistrationNo = decrypt(find.registration_no, secretKey);

      // Sending response with decrypted data
      const district = await prisma.pincode_data.findFirst({
        where: {
          pincode: find.pincode,
        },
        select: {
          district: true,
        },
      });

      return res.status(200).json({
        data: {
          ...find,
          ...district,
          // phone_no: decryptedPhone,
          // email: decryptedEmail,
          // registration_no: decryptedRegistrationNo,
        },
        error: false,
        success: true,
      });
    } else {
      return res.status(400).json({
        message: "No data",
        success: false,
        error: true,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const hospital_feedback = async (req, res) => {
  try {
    const datetime = getCurrentDateInIST();
    const { user_id, hospital_id, message, rating, interactedid } = req.body;
    const status = "requested";
    if (!user_id || !hospital_id) {
      return res.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }
    const update = await prisma.hospital_interacteduser.update({
      where: {
        id: interactedid,
      },
      data: {
        status: "Y",
        st_modifiedDate: datetime,
      },
    });

    const create = await prisma.hospital_feedback.create({
      data: {
        user_id,
        hospital_id,
        message,
        rating,
        status: status,
        created_date: datetime,
      },
    });
    if (create) {
      res.status(201).json({
        error: false,
        message: "Successfully added your feedback",
        data: create,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital_feedback API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const hospital_searchdata = async (req, res) => {
  console.log("hospitalllllll_searchdataaa");
  try {
    const { user_id, speciality, type } = req.body;
    const datetime = getCurrentDateInIST();
    // Input validation: check if at least speciality or type is provided
    if (!speciality && !type) {
      return res.status(400).json({
        error: true,
        message: "Either speciality or type must be provided",
      });
    }

    const create = await prisma.hospital_searchdata.create({
      data: {
        user_id: user_id || null,
        speciality,
        type,
        created_date: datetime,
      },
    });
    console.log({ create });
    if (create) {
      res.status(201).json({
        error: false,
        message: "successfull",
        data: create,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital_searchdata API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const get_feedback = async (req, res) => {
  const id = req.body.id;
  try {
    const data = await prisma.hospital_feedback.findMany({
      where: {
        id: id,
      },
      orderBy: {
        created_date: "desc",
      },
    });
    res.status(200).json(data);
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital get_feedback API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const get_searchdata = async (req, res) => {
  try {
    const data = await prisma.hospital_searchdata.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    if (data.length > 0) {
      res.status(200).json({
        success: true,
        error: false,
        data: data,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital get_searchdata API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

const hospital_doctordetails = async (req, res) => {
  try {
    const { hospital_id, doctor_id } = req.body;
    if (!hospital_id || !doctor_id) {
      return res.status(400).json({
        true: true,
        success: false,
        message: "required fields can't be null",
      });
    }
    const find = await prisma.doctor_hospital.findFirst({
      where: {
        hospital_id,
        doctor_id,
      },
      select: {
        id: true,
        days_timing: true,
        isavailable: true,
        consultation_fees: true,
        doctorId: true,
        hospitalid: true,
      },
    });

    if (find) {
      return res.status(200).json({
        success: true,
        error: false,
        data: find,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital_doctordetails API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    //await prisma.$disconnect();
  }
};

//a single hospital feedback
const getahospitalfeedback = async (req, res) => {
  const hospital_id = req.body.hospital_id;
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    if (!hospital_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "hospital_id can't be null",
      });
    }
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const datas = await prisma.hospital_feedback.findMany({
      where: {
        hospital_id,
        status: "accepted",
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        message: true,
        userid: {
          select: {
            name: true,
          },
        },
        rating: true,
        created_date: true,
      },
    });

    const data = datas.map((feedback) => {
      return {
        ...feedback,
        userid: {
          ...feedback.userid,
          name: safeDecrypt(feedback.userid.name, secretKey), // Decrypt the name here
        },
      };
    });

    // Calculate the sum and average of the ratings
    const totalRatings = datas.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    const averageRating = datas.length > 0 ? totalRatings / datas.length : 0;
    const updaterating = await prisma.hospital_details.update({
      where: {
        id: hospital_id,
      },
      data: {
        rating: averageRating,
      },
    });

    res.status(200).json({
      success: true,
      data: data,
      averageRating: averageRating,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getahospitalfeedback API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

//approve or reject hospital feedback
const feedbackapproval = async (req, res) => {
  const { id, status } = req.body;

  try {
    // Update the status of the doctor_feedback entry with the provided id
    const updatedFeedback = await prisma.hospital_feedback.update({
      where: { id: id },
      data: { status: status },
    });
    if (updatedFeedback) {
      res.status(200).json({
        success: true,
        message: `successfully ${status} the request`,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital feedbackapproval API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const hospital_disable = async (request, response) => {
  try {
    const { id, type, status } = request.body;
    const datetime = getCurrentDateInIST();
    if (id && status) {
      const disable = await prisma.hospital_details.update({
        where: {
          id: id,
        },
        data: {
          status: status,
          updatedDate: datetime,
        },
      });
      let newstatus;
      if (status === "Y") {
        newstatus = "approved";
      } else if (status === "N") {
        newstatus = "disabled";
      }
      response.status(200).json({
        success: true,
        message: `Hospital ${newstatus} successfully.`,
      });
    } else if ((type = "all")) {
      // Calculate the date 6 months ago
      const sixMonthsAgo = new Date(datetime);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const inactive = await prisma.hospital_details.findMany({
        where: {
          last_active: {
            lt: sixMonthsAgo,
          },
        },
        orderBy: {
          datetime: "asc",
        },
      });

      // const allDoctors = await prisma.hospital_details.findMany();

      // if (allDoctors.length > 0) {
      //   for (const doctor of allDoctors) {
      //     // Assuming last_active is stored as a Date object in the database
      //     if (new Date(doctor.last_active) < sixMonthsAgo) {

      //     }
      //   }
      // }

      response.status(200).json({
        sucess: true,
        data: inactive,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital_disable API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const getunapprovehsptl = async (request, response) => {
  try {
    const complete_data = await prisma.hospital_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });
    if (complete_data.length > 0) {
      response.status(200).json({
        success: true,
        data: complete_data,
      });
    } else {
      response.status(400).json({
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getunapprovehsptl API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const approvehospital = async (request, response) => {
  try {
    const { id, status } = request.body;
    const datetime = getCurrentDateInIST();

    if (!id) {
      return response.status(400).json({ message: "Hospital ID is required." });
    }

    if (status !== "Y" && status !== "N" && status !== "R") {
      return response.status(400).json({ message: "Invalid status value." });
    }

    const hospital = await prisma.hospital_details.update({
      where: { id: id },
      data: { status: status, updatedDate: datetime },
    });

    if (hospital) {
      let message;
      if (status === "Y") {
        message = "Hospital Approved.";
      } else if (status === "N") {
        message = "Hospital Disabled.";
      } else {
        message = "Hospital Rejected.";
      }
      response.status(200).json({ message: message });
    } else {
      response.status(404).json({ message: "Hospital not found." });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in approvehospital API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

const hospital_doctors = async (request, response) => {
  try {
    const hospitalid = request.body.id;
    if (!hospitalid) {
      return response.status(404).json({
        message: "hospital id can't be null",
        error: true,
      });
    }

    const datas = await prisma.doctor_hospital.findMany({
      where: {
        hospital_id: hospitalid,
      },

      distinct: ["doctor_id"],
      select: {
        doctorId: true,
        // doctorId:{
        //   select:{
        //     id:true,
        //     name:true,
        //     type:true,
        //     specialization:true,
        //     image:true
        //   }
        // }
      },
    });
    if (datas.length > 0) {
      return response.status(200).json({
        data: datas,
        error: false,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "NO data",
        success: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospital-hospital_doctors API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    //await prisma.$disconnect();
  }
};

module.exports = {
  hospital_registration,
  hospital_login,
  get_hospital,
  edit_hospital,
  delete_hospital,
  add_doctor,
  consultation_data,
  filter_byName,
  hospital_filter,
  getHospitalAddress,
  get_hospitalBypin,
  doctor_consultationList,
  edit_consultation,
  delete_availability,
  getDoctorList,
  get_hospitalDetails,
  hospital_feedback,
  hospital_searchdata,
  get_feedback,
  get_searchdata,
  hospital_doctordetails,
  getahospitalfeedback,
  feedbackapproval,
  editbyadmin,
  hospital_disable,
  getunapprovehsptl,
  approvehospital,
  completeedit,
  hospital_doctors,
};
