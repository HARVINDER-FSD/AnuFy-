"use client"

import { useState, useEffect } from "react"
import { Bookmark, Film, Grid3X3, Heart, MessageCircle, Play, Trash2, UserPlus, X } from "lucide-react"
import { InstagramPostModal } from "./instagram-post-modal"

interface ContentGridProps {
  type: 'posts' | 'reels' | 'saved' | 'tagged';
  items: any[];
  currentUserId?: string;
  onItemDeleted?: (itemId: string) => void;
  onLikeUpdate?: (itemId: string, isLiked: boolean, likesCount: number) => void;
}

export function ContentGrid({ type, items, currentUserId, onItemDeleted, onLikeUpdate }: ContentGridProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [localItems, setLocalItems] = useState(items)
  
  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Reset selected item and modal state when type changes
  useEffect(() => {
    setSelectedItem(null);
    setShowModal(false);
  }, [type]);

  // Handle like update from modal
  const handleLikeUpdate = (itemId: string, isLiked: boolean, likesCount: number) => {
    console.log('[ContentGrid] Like update received:', { itemId, isLiked, likesCount })
    
    // Update local items
    setLocalItems(prevItems => {
      const updated = prevItems.map(item => 
        item.id === itemId 
          ? { ...item, is_liked: isLiked, liked: isLiked, likes: likesCount, likes_count: likesCount }
          : item
      )
      console.log('[ContentGrid] Updated local items:', updated.find(i => i.id === itemId))
      return updated
    });
    
    // Update selected item if it's the one being liked
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev: any) => {
        const updated = {
          ...prev,
          is_liked: isLiked,
          liked: isLiked,
          likes: likesCount,
          likes_count: likesCount
        }
        console.log('[ContentGrid] Updated selected item:', updated)
        return updated
      });
    }
    
    // Notify parent component
    if (onLikeUpdate) {
      console.log('[ContentGrid] Notifying parent component')
      onLikeUpdate(itemId, isLiked, likesCount);
    }
  };

  // Empty state components
  const EmptyState = () => {
    switch(type) {
      case 'posts':
        return (
          <>
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">When you share posts, they will appear here</p>
          </>
        );
      case 'reels':
        return (
          <>
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reels yet</h3>
            <p className="text-muted-foreground">When you share reels, they will appear here</p>
          </>
        );
      case 'saved':
        return (
          <>
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
            <p className="text-muted-foreground">Posts you save will appear here</p>
          </>
        );
      case 'tagged':
        return (
          <>
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tagged posts yet</h3>
            <p className="text-muted-foreground">Posts you're tagged in will appear here</p>
          </>
        );
      default:
        return null;
    }
  };

  // If no items, show empty state
  if (!localItems || localItems.length === 0) {
    return (
      <div className="text-center py-12">
        <EmptyState />
      </div>
    );
  }

  const handleItemClick = (item: any) => {
    console.log(`${type} item clicked:`, item);
    setSelectedItem(item);
    setShowModal(true);
  };
  
  // Handle delete item
  const handleDeleteItem = async (item: any) => {
    try {
      const endpoint = type === 'reels' 
        ? `/api/reels/${item.id}`
        : `/api/posts/${item.id}`;
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Close modal and notify parent
        setShowModal(false);
        if (onItemDeleted) {
          onItemDeleted(item.id);
        }
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  
  const handleCloseModal = () => {
    console.log("Closing modal");
    setShowModal(false);
    // Clear selected item after animation completes
    setTimeout(() => setSelectedItem(null), 300);
  };
  
  const handleDelete = async (itemId: string) => {
    if (!confirm(`Delete this ${type === 'reels' ? 'reel' : 'post'}? This will permanently remove it.`)) return;
    
    try {
      const endpoint = type === 'reels' ? `/api/reels/${itemId}` : `/api/posts/${itemId}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert(`${type === 'reels' ? 'Reel' : 'Post'} deleted!`);
        setSelectedItem(null);
        setShowModal(false);
        if (onItemDeleted) onItemDeleted(itemId);
      } else {
        alert(`Failed to delete ${type === 'reels' ? 'reel' : 'post'}`);
      }
    } catch (error) {
      alert(`Error deleting ${type === 'reels' ? 'reel' : 'post'}`);
    }
  };

  // Render grid items based on type
  const renderGridItems = () => {
    return localItems.map((item: any) => (
      <div
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`relative ${type === 'reels' ? 'aspect-[9/16]' : 'aspect-square'} group cursor-pointer bg-gray-200 dark:bg-gray-800 rounded-sm overflow-hidden`}
      >
        {/* Thumbnail/Image */}
        {type === 'reels' ? (
          <>
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.caption || "Reel"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.jpg";
                }}
              />
            ) : item.video_url || item.video ? (
              <video
                src={item.video_url || item.video}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
              </div>
            )}
            
            {/* Play icon overlay for reels */}
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
            </div>
            
            {/* Hover overlay with stats */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Heart className={`w-6 h-6 ${item.is_liked || item.liked ? 'fill-red-500 text-red-500' : 'fill-white'}`} />
                  <span className="font-bold text-lg">{item.likes_count || item.likes || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" fill="white" />
                  <span className="font-bold text-lg">{item.comments_count || item.comments || 0}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <img
              src={item.image || item.media_urls?.[0] || "/placeholder-image.jpg"}
              alt={item.content || item.caption || "Post"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.jpg";
              }}
            />
            
            {/* Multiple images indicator */}
            {item.media_urls && item.media_urls.length > 1 && (
              <div className="absolute top-2 right-2">
                <div className="bg-black/60 rounded-full p-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Hover overlay with stats for posts */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Heart className={`w-6 h-6 ${item.is_liked || item.liked ? 'fill-red-500 text-red-500' : 'fill-white'}`} />
                  <span className="font-bold text-lg">{item.likes_count || item.likes || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" fill="white" />
                  <span className="font-bold text-lg">{item.comments_count || item.comments || 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    ));
  };

  // Render modal content based on type
  const renderModalContent = () => {
    if (!selectedItem) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={handleCloseModal}></div>
        
        {/* Modal Content */}
        <div className={`relative bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full ${type === 'reels' ? 'max-h-[90vh] overflow-hidden' : 'max-h-[90vh] overflow-auto'}`}>
          <button 
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/20 text-white"
            onClick={handleCloseModal}
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Content Display */}
          {type === 'reels' ? (
            <>
              {/* Reel Video */}
              <div className="aspect-[9/16] w-full">
                <video 
                  src={selectedItem.video_url || selectedItem.video} 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              </div>
            </>
          ) : (
            <>
              {/* Post Image */}
              <div className="w-full aspect-square">
                <img 
                  src={selectedItem.image || selectedItem.media_urls?.[0] || '/placeholder-image.jpg'} 
                  alt={selectedItem.content || "Post"} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            </>
          )}
          
          {/* Content Info */}
          <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* User info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img 
                  src={selectedItem.user?.avatar || "/placeholder-image.jpg"} 
                  alt={selectedItem.user?.username || "User"} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-image.jpg";
                  }}
                />
              </div>
              <div>
                <p className="font-semibold text-sm">{selectedItem.user?.username || "User"}</p>
              </div>
              
              {/* Delete option for own content */}
              {(currentUserId === selectedItem.user?.id || selectedItem.isOwner) && (
                <button 
                  className="ml-auto text-red-500 text-sm flex items-center gap-1"
                  onClick={() => handleDelete(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
            
            {/* Content caption/text */}
            <p className="text-sm mb-3">{selectedItem.caption || selectedItem.content || selectedItem.description || "No caption"}</p>
            
            {/* Content stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{selectedItem.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{selectedItem.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {localItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg">
          <EmptyState />
        </div>
      ) : (
        <div className={`grid ${type === 'reels' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-3 md:grid-cols-4'} gap-1 md:gap-2`}>
          {renderGridItems()}
        </div>
      )}
      
      {/* Instagram-Style Post/Reel Modal */}
      {(type === 'posts' || type === 'reels' || type === 'saved' || type === 'tagged') && (
        <InstagramPostModal
          item={selectedItem}
          type={type === 'reels' ? 'reels' : 'posts'}
          currentUserId={currentUserId}
          isOpen={showModal}
          onClose={handleCloseModal}
          onDelete={onItemDeleted}
          onLikeUpdate={handleLikeUpdate}
        />
      )}
    </div>
  );
}