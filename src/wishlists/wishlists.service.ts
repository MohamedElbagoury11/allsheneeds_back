import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async create(createWishlistDto: DeepPartial<Wishlist>): Promise<Wishlist> {
    const wishlist = this.wishlistRepository.create(createWishlistDto);
    return this.wishlistRepository.save(wishlist);
  }

  async findAll(): Promise<Wishlist[]> {
    return this.wishlistRepository.find({ relations: ['user', 'product'] });
  }

  async findOne(id: number): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });
    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }
    return wishlist;
  }

  async update(id: number, updateWishlistDto: any): Promise<Wishlist> {
    const wishlist = await this.findOne(id);
    this.wishlistRepository.merge(wishlist, updateWishlistDto);
    return this.wishlistRepository.save(wishlist);
  }

  async remove(id: number): Promise<void> {
    const wishlist = await this.findOne(id);
    await this.wishlistRepository.remove(wishlist);
  }
}
