import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, role, action, fullName, email, customPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "UPDATE_USER" || fullName !== undefined || email !== undefined) {
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName.trim();
      if (email !== undefined) updateData.email = email.trim();
      if (role !== undefined) updateData.globalRole = role;
      if (customPassword && customPassword.trim()) {
        updateData.passwordHash = await bcrypt.hash(customPassword.trim(), 10);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin người dùng ${updated.email}`,
        user: updated
      });
    }

    if (action === "TOGGLE_LOCK") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
      });

      return NextResponse.json({
        success: true,
        message: updated.isActive
          ? `Đã mở khóa tài khoản cho ${updated.fullName || updated.email}`
          : `Đã khóa tài khoản của ${updated.fullName || updated.email}`,
        isActive: updated.isActive
      });
    }

    if (action === "DELETE_USER") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      await prisma.user.delete({ where: { id: userId } });

      return NextResponse.json({
        success: true,
        message: `Đã xóa vĩnh viễn tài khoản ${user.email}`
      });
    }

    if (action === "RESET_PASSWORD") {
      const tempPass = "Reset" + Math.floor(100000 + Math.random() * 900000);
      const passwordHash = await bcrypt.hash(tempPass, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      return NextResponse.json({
        success: true,
        message: `Mật khẩu mới cho tài khoản là: ${tempPass}`,
        tempPassword: tempPass
      });
    }

    if (role) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { globalRole: role }
      });

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật vai trò tài khoản thành ${role}`,
        user: updatedUser
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating user admin action:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}
