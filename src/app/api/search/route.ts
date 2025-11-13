import { NextRequest, NextResponse } from 'next/server';
import { productServiceFunctions } from '../../../lib/product-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    // Use the existing product service search functionality
    const searchResults = await productServiceFunctions.searchProducts(query, {
      limit,
      offset
    });

    if (!searchResults.success) {
      return NextResponse.json({
        success: false,
        error: searchResults.error || 'Search failed'
      }, { status: 500 });
    }

    // Get additional filter data if requested

    if (category || brand || minPrice !== undefined || maxPrice !== undefined) {
      // Apply additional filters to search results
      const filters: any = {};

      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (minPrice !== undefined) filters.priceMin = minPrice;
      if (maxPrice !== undefined) filters.priceMax = maxPrice;

      // For now, we'll return the basic search results
      // In a more advanced implementation, you might want to apply these filters
    }

    return NextResponse.json({
      success: true,
      data: {
        query: query.trim(),
        results: searchResults.data?.documents || [],
        total: searchResults.data?.total || 0,
        limit,
        offset,
        hasMore: ((offset + limit) < (searchResults.data?.total || 0))
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}