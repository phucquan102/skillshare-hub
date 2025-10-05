// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import { courseService, Course } from '../services/api/courseService';

export interface Category {
  key: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  courseCount?: number;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Lấy tất cả các courses để thống kê số lượng theo category
        const response = await courseService.getCourses({
          page: 1,
          limit: 1000,
          status: 'published'
        });

        // Nhóm courses theo category và đếm số lượng
        const categoryCounts: { [key: string]: number } = {};
        response.courses.forEach((course: Course) => {
          categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1;
        });

        // Tạo danh sách categories với số lượng courses
        const categoryData: Category[] = [
          {
            key: 'programming',
            name: 'Programming',
            description: 'Learn coding and software development',
            icon: '💻',
            image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
            courseCount: categoryCounts['programming'] || 0
          },
          {
            key: 'design',
            name: 'Design',
            description: 'Master design principles and tools',
            icon: '🎨',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
            courseCount: categoryCounts['design'] || 0
          },
          {
            key: 'business',
            name: 'Business',
            description: 'Develop business and management skills',
            icon: '💼',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
            courseCount: categoryCounts['business'] || 0
          },
          {
            key: 'marketing',
            name: 'Marketing',
            description: 'Learn digital marketing strategies',
            icon: '📈',
            image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=250&fit=crop',
            courseCount: categoryCounts['marketing'] || 0
          },
          {
            key: 'language',
            name: 'Language',
            description: 'Master new languages and communication',
            icon: '🗣️',
            image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=250&fit=crop',
            courseCount: categoryCounts['language'] || 0
          },
          {
            key: 'music',
            name: 'Music',
            description: 'Explore music theory and instruments',
            icon: '🎵',
            image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=250&fit=crop',
            courseCount: categoryCounts['music'] || 0
          },
          {
            key: 'photography',
            name: 'Photography',
            description: 'Capture stunning photos and videos',
            icon: '📸',
            image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=250&fit=crop',
            courseCount: categoryCounts['photography'] || 0
          },
          {
            key: 'cooking',
            name: 'Cooking',
            description: 'Learn culinary arts and recipes',
            icon: '👨‍🍳',
            image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=250&fit=crop',
            courseCount: categoryCounts['cooking'] || 0
          },
          {
            key: 'fitness',
            name: 'Fitness',
            description: 'Achieve your health and fitness goals',
            icon: '💪',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
            courseCount: categoryCounts['fitness'] || 0
          }
        ];

        // Lọc ra chỉ những categories có ít nhất 1 course
        const categoriesWithCourses = categoryData.filter(category => 
          category.courseCount && category.courseCount > 0
        );

        setCategories(categoriesWithCourses);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};