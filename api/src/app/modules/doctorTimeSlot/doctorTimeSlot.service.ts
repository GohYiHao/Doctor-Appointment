import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../shared/prisma";
import { DoctorTimeSlot, ScheduleDay } from "@prisma/client";

const createTimeSlot = async (user: any, payload: any): Promise<DoctorTimeSlot | null> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const result = await prisma.doctorTimeSlot.create({
        data: {
            day: payload.day,
            doctorId: isDoctor.id,
            maximumPatient: payload.maximumPatient,
            weekDay: payload.weekDay,
            timeSlot: {
                create: payload.timeSlot.map((item: any) => ({
                    startTime: item.startTime,
                    endTime: item.endTime
                }))
            }
        }
    })
    return result;
}

const deleteTimeSlot = async (id: string): Promise<DoctorTimeSlot | null> => {
    const result = await prisma.doctorTimeSlot.delete({
        where: {
            id: id
        }
    })
    return result;
}

const getTimeSlot = async (id: string): Promise<DoctorTimeSlot | null> => {
    const result = await prisma.doctorTimeSlot.findFirst({
        where: {
            id: id
        }
    })
    return result;
}

const getMyTimeSlot = async (user: any, filter: any): Promise<DoctorTimeSlot[] | null> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    let andCondition: any = { doctorId: isDoctor.id };
    if (filter.day) {
        andCondition.day = filter.day
    }

    const whereCondition = andCondition ? andCondition : {}
    const result = await prisma.doctorTimeSlot.findMany({
        where: whereCondition,
        include: {
            timeSlot: true
        }
    })
    return result;
}

const getAllTimeSlot = async (): Promise<DoctorTimeSlot[] | null> => {
    const result = await prisma.doctorTimeSlot.findMany({
        include: {
            timeSlot: true,
            doctor: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    })
    return result;
}
const updateTimeSlot = async (user: any, id: string, payload: any): Promise<{message: string}> => {
    const { userId } = user;
    const isDoctor = await prisma.doctor.findUnique({
        where: {
            id: userId
        }
    })
    if (!isDoctor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Doctor Account is not found !!')
    }
    const { timeSlot, create } = payload;

    if(create && create.length > 0){
        const doctorTimeSlot = await prisma.doctorTimeSlot.findFirst({
            where: {
                day: create[0].day
            }
        })
        if (!doctorTimeSlot) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Time Slot is not found !!')
        }
        await Promise.all(create.map(async(item: ScheduleDay) => {
            try {
                await prisma.scheduleDay.create({
                    data: {
                        startTime: item.startTime,
                        endTime: item.endTime,
                        doctorTimeSlotId: doctorTimeSlot?.id
                    }
                })
            } catch (error) {
                throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to create')
            }
        }))
    }

    if(timeSlot && timeSlot.length > 0){
        await Promise.all(timeSlot.map(async(item: ScheduleDay) =>{
            const {doctorTimeSlotId, ...others} = item;
            try {
                await prisma.scheduleDay.updateMany({
                    where: {id: others.id},
                    data: {
                        startTime: others.startTime,
                        endTime: others.endTime
                    }
                })
            } catch (error) {
                throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to Update')
            }
        }))
    }
    return {
        message: 'Successfully Updated'
    }
}

export const TimeSlotService = {
    updateTimeSlot,
    getAllTimeSlot,
    getTimeSlot,
    createTimeSlot,
    deleteTimeSlot,
    getMyTimeSlot
}