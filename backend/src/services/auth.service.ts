import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { RegisterInput, LoginInput } from '../validators';

export class AuthService {
  /**
   * Registra un nuevo usuario organizador
   */
  static async register(data: RegisterInput) {
    const rawEmail = data.email.trim();
    const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@rifaapp.com`;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name: data.name.trim() },
        ],
      },
    });

    if (existing) {
      throw new Error('Ya existe una cuenta con este usuario o email');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: data.name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = AuthService.generateToken(user.id);
    return { user, token };
  }

  /**
   * Inicia sesión (acepta username o email directo)
   */
  static async login(data: LoginInput) {
    const identifier = data.email.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: `${identifier}@rifaapp.com` },
          { name: identifier },
        ],
      },
    });

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    const token = AuthService.generateToken(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Obtiene el usuario actual
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Genera un JWT
   */
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }
}
