import React, { useState } from 'react';
import { X, Code, Copy, Check, Terminal, Layers, Database, Shield } from 'lucide-react';

interface ComposeReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComposeReferenceModal: React.FC<ComposeReferenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'room' | 'compose' | 'admob' | 'permissions'>('room');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomCode = `// 1. Room Entity for Persistent Shayari Storage (Offline & Favorites)
@Entity(tableName = "shayari_table")
data class ShayariEntity(
    @PrimaryKey val id: String,
    val title: String?,
    val content: String,
    val author: String,
    val category: String,
    val type: String,
    val language: String,
    val isFavorite: Boolean = false,
    val isDownloaded: Boolean = false,
    val isUserCreated: Boolean = false,
    val sourceUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

// 2. Room Data Access Object (DAO)
@Dao
interface ShayariDao {
    @Query("SELECT * FROM shayari_table ORDER BY createdAt DESC")
    fun getAllShayaris(): Flow<List<ShayariEntity>>

    @Query("SELECT * FROM shayari_table WHERE isFavorite = 1")
    fun getFavorites(): Flow<List<ShayariEntity>>

    @Query("SELECT * FROM shayari_table WHERE isDownloaded = 1")
    fun getOfflineDownloads(): Flow<List<ShayariEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(shayari: ShayariEntity)

    @Delete
    suspend fun delete(shayari: ShayariEntity)

    @Query("UPDATE shayari_table SET isFavorite = :fav WHERE id = :id")
    suspend fun updateFavorite(id: String, fav: Boolean)
}`;

  const composeCode = `// 3. Jetpack Compose Bottom Navigation & Card UI
@Composable
fun ManKaShabdaApp(viewModel: ShayariViewModel = viewModel()) {
    val navController = rememberNavController()
    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF881337)) { // Nepali Crimson
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("गृह (Home)", color = Color.White) },
                    selected = true,
                    onClick = { /* navigate */ }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                    label = { Text("खोज (Search)", color = Color.White) },
                    selected = false,
                    onClick = { /* navigate */ }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Create, contentDescription = "Create") },
                    label = { Text("सिर्जना (Create)", color = Color.White) },
                    selected = false,
                    onClick = { /* navigate */ }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Favorite, contentDescription = "Favorites") },
                    label = { Text("मनपरेका (Fav)", color = Color.White) },
                    selected = false,
                    onClick = { /* navigate */ }
                )
            }
        }
    ) { innerPadding ->
        ShayariListScreen(modifier = Modifier.padding(innerPadding))
    }
}`;

  const admobCode = `// 4. Google AdMob AndroidView with Official Test Banner
@Composable
fun AdMobBannerView(modifier: Modifier = Modifier) {
    // Official Google AdMob Android Banner Test Ad Unit ID
    val testBannerId = "ca-app-pub-3940256099942544/6300978111"

    AndroidView(
        modifier = modifier.fillMaxWidth(),
        factory = { context ->
            AdView(context).apply {
                setAdSize(AdSize.BANNER)
                adUnitId = testBannerId
                loadAd(AdRequest.Builder().build())
            }
        }
    )
}`;

  const permissionsCode = `<!-- 5. AndroidManifest.xml Permissions & File Saving -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Scoped storage image download for Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <!-- Legacy storage for Android 12 and below -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />

    <application
        android:label="Man Ka Shabda - नेपाली शायरी"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.ManKaShabda">
        
        <!-- Official AdMob Sample App ID for development -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"/>
    </application>
</manifest>`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'room':
        return roomCode;
      case 'compose':
        return composeCode;
      case 'admob':
        return admobCode;
      case 'permissions':
        return permissionsCode;
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-800 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-white font-nepali">
                Android Kotlin & Jetpack Compose Reference
              </h3>
              <p className="text-xs text-slate-400">
                Architecture, Room DB Dao, and AdMob integration specs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex gap-1.5 pt-4 pb-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('room')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'room' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Room Database</span>
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'compose' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Jetpack Compose</span>
          </button>
          <button
            onClick={() => setActiveTab('admob')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'admob' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>AdMob Banner</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'permissions' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Permissions & Manifest</span>
          </button>
        </div>

        {/* Code display */}
        <div className="relative mt-2">
          <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[340px] border border-slate-800 leading-relaxed select-all">
            {getActiveCode()}
          </pre>
          <button
            onClick={handleCopyCode}
            className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs flex items-center gap-1 shadow-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Ready to compile in Android Studio Ladybug/Koala</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
