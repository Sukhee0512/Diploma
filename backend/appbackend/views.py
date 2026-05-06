# services.py
import os
import json
import uuid
import psycopg2
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from backend.settings import sendResponse, connectDB, disconnectDB
from django.conf import settings


# ==================== USER SERVICES ====================

def dt_login(request):
    """Хэрэглэгч нэвтрэх (admin, gym_manager, user)"""
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        email = jsons.get('email')
        password = jsons.get('password')
        
        if not email or not password:
            return sendResponse(request, 3006, [], action)
    except:
        return sendResponse(request, 3006, [], action)

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        cursor.execute("""
            SELECT id, name, email, COALESCE(role, 'user') as role, created_at
            FROM users
            WHERE email = %s AND password = %s
        """, (email, password))

        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        cursor.close()

        if len(rows) == 1:
            user = dict(zip(columns, rows[0]))
            
            user_data = {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "created_at": str(user["created_at"]) if user["created_at"] else None
            }
            
            return sendResponse(request, 1002, [user_data], action)
        else:
            return sendResponse(request, 1004, [{"email": email}], action)

    except Exception as e:
        print("LOGIN ERROR:", e)
        return sendResponse(request, 5001, [], action)
    finally:
        disconnectDB(myConn)


def dt_register(request):
    """Шинэ хэрэглэгч бүртгэх"""
    jsons = json.loads(request.body)
    action = jsons["action"]
    
    try:
        name = jsons.get("name", "").strip()
        email = jsons.get("email", "").strip()
        password = jsons.get("password")
        
        if not name or not email or not password:
            return sendResponse(request, 3007, [], action)
    except:
        return sendResponse(request, 3007, [], action)
    
    try:
        conn = connectDB()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = %s", (email,))
        existing = cursor.fetchone()[0]
        
        if existing == 0:
            cursor.execute("""
                INSERT INTO users (name, email, password, role, created_at) 
                VALUES (%s, %s, %s, 'user', NOW())
                RETURNING id, name, email, role, created_at
            """, (name, email, password))
            
            new_user = cursor.fetchone()
            conn.commit()
            
            user_data = {
                "id": new_user[0],
                "name": new_user[1],
                "email": new_user[2],
                "role": new_user[3],
                "created_at": str(new_user[4]) if new_user[4] else None
            }
            
            return sendResponse(request, 200, [user_data], action)
        else:
            return sendResponse(request, 3008, [{"email": email}], action)
            
    except Exception as e:
        print("REGISTER ERROR:", e)
        return sendResponse(request, 5002, [{"error": str(e)}], action)
    finally:
        disconnectDB(conn)


def dt_changepassword(request):
    """Нууц үг солих"""
    jsons = json.loads(request.body)
    action = jsons['action']
    
    try:
        email = jsons.get('email')
        old_password = jsons.get('old_password')
        new_password = jsons.get('new_password')
        
        if not email or not old_password or not new_password:
            return sendResponse(request, 3021, [], action)
    except:
        return sendResponse(request, 3021, [], action)
    
    try: 
        myConn = connectDB()
        cursor = myConn.cursor()
        
        cursor.execute("""
            SELECT id, name, email
            FROM users
            WHERE email = %s AND password = %s
        """, (email, old_password))
        
        user = cursor.fetchone()
        
        if user:
            user_id = user[0]
            
            cursor.execute("""
                UPDATE users SET password = %s WHERE id = %s
            """, (new_password, user_id))
            myConn.commit()
            
            user_data = {
                "id": user_id,
                "name": user[1],
                "email": user[2]
            }
            
            return sendResponse(request, 3022, [user_data], action)
        else:
            return sendResponse(request, 3023, [{"email": email}], action)
            
    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)
        return sendResponse(request, 5006, [{"error": str(e)}], action)
    finally:
        disconnectDB(myConn)


def get_user_profile(request):
    """Хэрэглэгчийн мэдээллийг авах"""
    jsons = json.loads(request.body)
    action = jsons['action']
    
    try:
        user_id = jsons.get('user_id')
        if not user_id:
            return sendResponse(request, 400, [], action)
    except:
        return sendResponse(request, 400, [], action)
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        cursor.execute("""
            SELECT id, name, email, created_at
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if user:
            user_data = {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "created_at": str(user[3]) if user[3] else None
            }
            return sendResponse(request, 200, [user_data], action)
        else:
            return sendResponse(request, 404, [{"message": "User not found"}], action)
            
    except Exception as e:
        print("GET USER PROFILE ERROR:", e)
        return sendResponse(request, 500, [{"error": str(e)}], action)
    finally:
        disconnectDB(myConn)


def update_user_profile(request):
    """Хэрэглэгчийн профайлыг шинэчлэх"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        user_id = jsons.get('user_id')
        name = jsons.get('name')
        phone = jsons.get('phone', '')
        address = jsons.get('address', '')
        birth_date = jsons.get('birth_date', '')
        gender = jsons.get('gender', '')
        
        if not user_id:
            return sendResponse(request, 400, [], action)
    except:
        return sendResponse(request, 400, [], action)
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        update_fields = []
        params = []
        
        if name:
            update_fields.append("name = %s")
            params.append(name)
        if phone:
            update_fields.append("phone = %s")
            params.append(phone)
        if address:
            update_fields.append("address = %s")
            params.append(address)
        if birth_date:
            update_fields.append("birth_date = %s")
            params.append(birth_date)
        if gender:
            update_fields.append("gender = %s")
            params.append(gender)
        
        if update_fields:
            params.append(user_id)
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """
            cursor.execute(query, params)
            myConn.commit()
        
        cursor.execute("""
            SELECT id, name, email, phone, address, birth_date, gender, created_at
            FROM users WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        user_data = {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "phone": user[3] or "",
            "address": user[4] or "",
            "birth_date": str(user[5]) if user[5] else "",
            "gender": user[6] or "",
            "created_at": str(user[7]) if user[7] else None
        }
        
        return sendResponse(request, 200, [user_data], action)
        
    except Exception as e:
        print("UPDATE USER PROFILE ERROR:", e)
        return sendResponse(request, 500, [], action)
    finally:
        disconnectDB(myConn)


# ==================== ADMIN: USER ROLE MANAGEMENT ====================

def update_user_role(request):
    """Хэрэглэгчийн role-г өөрчлөх (Зөвхөн admin)"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        user_id = jsons.get('user_id')
        new_role = jsons.get('role')
        
        if not user_id or not new_role:
            return sendResponse(request, 400, [], action)
        
        if new_role not in ['user', 'gym_manager', 'admin']:
            return sendResponse(request, 400, {"message": "Invalid role"}, action)
    except:
        return sendResponse(request, 400, [], action)
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        cursor.execute("SELECT id, name, email, role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return sendResponse(request, 404, {"message": "User not found"}, action)
        
        cursor.execute("""
            UPDATE users SET role = %s WHERE id = %s
            RETURNING id, name, email, role, created_at
        """, (new_role, user_id))
        
        updated_user = cursor.fetchone()
        myConn.commit()
        
        user_data = {
            "id": updated_user[0],
            "name": updated_user[1],
            "email": updated_user[2],
            "role": updated_user[3],
            "created_at": str(updated_user[4]) if updated_user[4] else None
        }
        
        return sendResponse(request, 200, [user_data], action)
        
    except Exception as e:
        print("UPDATE USER ROLE ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, action)
    finally:
        disconnectDB(myConn)


def get_all_users(request):
    """Бүх хэрэглэгчдийн жагсаалт (Admin)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_all_users")
        
        myConn = connectDB()
        user_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, email, COALESCE(role, 'user') as role, created_at
                FROM users
                ORDER BY created_at DESC
            """)
            
            users = cursor.fetchall()
            for user in users:
                cursor.execute("""
                    SELECT COUNT(*) FROM user_memberships 
                    WHERE user_id = %s AND status = 'active'
                """, (user[0],))
                active_memberships = cursor.fetchone()[0]
                
                cursor.execute("""
                    SELECT COUNT(*) FROM checkins WHERE user_id = %s
                """, (user[0],))
                checkins_count = cursor.fetchone()[0]
                
                user_dict = {
                    "id": user[0],
                    "name": user[1],
                    "email": user[2],
                    "role": user[3],
                    "created_at": str(user[4]) if user[4] else None,
                    "active_memberships": active_memberships,
                    "total_checkins": checkins_count
                }
                user_list.append(user_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, user_list, action)
    
    except Exception as e:
        print(f"GET ALL USERS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_all_users")


def get_users_by_role(request):
    """Role-оор хэрэглэгчдийг шүүх (Admin)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_users_by_role")
        role = data.get("role")
        
        myConn = connectDB()
        user_list = []
        
        with myConn.cursor() as cursor:
            if role:
                cursor.execute("""
                    SELECT id, name, email, role, created_at
                    FROM users
                    WHERE role = %s
                    ORDER BY created_at DESC
                """, (role,))
            else:
                cursor.execute("""
                    SELECT id, name, email, role, created_at
                    FROM users
                    ORDER BY created_at DESC
                """)
            
            users = cursor.fetchall()
            for u in users:
                user_dict = {
                    "id": u[0],
                    "name": u[1],
                    "email": u[2],
                    "role": u[3],
                    "created_at": str(u[4]) if u[4] else None
                }
                user_list.append(user_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, user_list, action)
    
    except Exception as e:
        print("GET USERS BY ROLE ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, "get_users_by_role")


def get_gym_managers(request):
    """Бүх gym manager-уудын жагсаалт (Admin)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_managers")
        
        myConn = connectDB()
        manager_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.role, u.created_at,
                       g.id as gym_id, g.name as gym_name, g.location
                FROM users u
                LEFT JOIN gyms g ON u.id = g.owner_id
                WHERE u.role = 'gym_manager'
                ORDER BY u.created_at DESC
            """)
            
            managers = cursor.fetchall()
            for m in managers:
                manager_dict = {
                    "id": m[0],
                    "name": m[1],
                    "email": m[2],
                    "role": m[3],
                    "created_at": str(m[4]) if m[4] else None,
                    "gym": {
                        "id": m[5],
                        "name": m[6],
                        "location": m[7]
                    } if m[5] else None
                }
                manager_list.append(manager_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, manager_list, action)
    
    except Exception as e:
        print("GET GYM MANAGERS ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_managers")


# ==================== GYM CRUD SERVICES ====================

def get_gyms(request):
    """Бүх гимнастикуудыг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gyms")
        
        myConn = connectDB()
        gym_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, location, image, created_at
                FROM gyms
                ORDER BY created_at DESC
            """)
            
            gyms = cursor.fetchall()
            for gym in gyms:
                gym_dict = {
                    "id": gym[0],
                    "name": gym[1],
                    "location": gym[2],
                    "image": gym[3] if gym[3] else None,
                    "created_at": str(gym[4]) if gym[4] else None
                }
                gym_list.append(gym_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, gym_list, action)
    
    except Exception as e:
        print(f"GET GYMS ERROR: {e}")
        return sendResponse(request, 500, [], "get_gyms")

def get_gym_by_id(request):
    """Гимнастикийн дэлгэрэнгүй мэдээлэл авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_by_id")
        gym_id = data.get("gym_id")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, location, image, created_at
                FROM gyms WHERE id = %s
            """, (gym_id,))
            gym = cursor.fetchone()
            
            if not gym:
                return sendResponse(request, 404, {"message": "Gym not found"}, action)
            
            # Get today's check-in count
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) = CURRENT_DATE
            """, (gym_id,))
            today_checkins = cursor.fetchone()[0]
            
            gym_detail = {
                "id": gym[0],
                "name": gym[1],
                "location": gym[2],
                "image": gym[3] if gym[3] else None,
                "created_at": str(gym[4]) if gym[4] else None,
                "today_checkins": today_checkins
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, [gym_detail], action)
    
    except Exception as e:
        print(f"GET GYM BY ID ERROR: {e}")
        return sendResponse(request, 500, [], "get_gym_by_id")


def create_gym(request):
    """Шинэ гимнастик үүсгэх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_gym")
        
        name = data.get("name", "").strip()
        location = data.get("location", "").strip()
        
        if not name or not location:
            return sendResponse(request, 400, {"message": "Нэр болон байршил шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM gyms WHERE name = %s", (name,))
            if cursor.fetchone():
                return sendResponse(request, 400, {"message": "Энэ нэртэй гимнастик аль хэдийн бүртгэлтэй байна"}, action)
            
            cursor.execute("""
                INSERT INTO gyms (name, location, created_at)
                VALUES (%s, %s, NOW())
                RETURNING id, name, location, image, created_at
            """, (name, location))
            
            new_gym = cursor.fetchone()
            myConn.commit()
            
            gym_data = {
                "id": new_gym[0],
                "name": new_gym[1],
                "location": new_gym[2],
                "image": new_gym[3] if new_gym[3] else None,
                "created_at": str(new_gym[4]) if new_gym[4] else None
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, [gym_data], action)
    
    except Exception as e:
        print(f"CREATE GYM ERROR: {e}")
        return sendResponse(request, 500, [], "create_gym")
    

def update_gym(request):
    """Гимнастикийн мэдээллийг засварлах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "update_gym")
        
        gym_id = data.get("gym_id")
        name = data.get("name")
        location = data.get("location")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM gyms WHERE id = %s", (gym_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Гимнастик олдсонгүй"}, action)
            
            update_fields = []
            params = []
            
            if name:
                update_fields.append("name = %s")
                params.append(name)
            if location:
                update_fields.append("location = %s")
                params.append(location)
            
            if update_fields:
                params.append(gym_id)
                query = f"""
                    UPDATE gyms 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, name, location, image, created_at
                """
                cursor.execute(query, params)
                updated_gym = cursor.fetchone()
                myConn.commit()
                
                gym_data = {
                    "id": updated_gym[0],
                    "name": updated_gym[1],
                    "location": updated_gym[2],
                    "image": updated_gym[3] if updated_gym[3] else None,
                    "created_at": str(updated_gym[4]) if updated_gym[4] else None
                }
            else:
                cursor.execute("SELECT id, name, location, image, created_at FROM gyms WHERE id = %s", (gym_id,))
                gym = cursor.fetchone()
                gym_data = {
                    "id": gym[0],
                    "name": gym[1],
                    "location": gym[2],
                    "image": gym[3] if gym[3] else None,
                    "created_at": str(gym[4]) if gym[4] else None
                }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, [gym_data], action)
    
    except Exception as e:
        print(f"UPDATE GYM ERROR: {e}")
        return sendResponse(request, 500, [], "update_gym")

def delete_gym(request):
    """Гимнастик устгах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "delete_gym")
        gym_id = data.get("gym_id")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM gyms WHERE id = %s", (gym_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Гимнастик олдсонгүй"}, action)
            
            cursor.execute("DELETE FROM gyms WHERE id = %s", (gym_id,))
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"message": "Гимнастик амжилттай устгагдлаа"}, action)
    
    except Exception as e:
        print(f"DELETE GYM ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "delete_gym")


# ==================== GYM MANAGER SERVICES ====================

def assign_gym_to_manager(request):
    """Gym manager-д gym оноох"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "assign_gym_to_manager")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        
        if not user_id or not gym_id:
            return sendResponse(request, 400, {"message": "user_id and gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                return sendResponse(request, 404, {"message": "User not found"}, action)
            
            if user[0] != 'gym_manager':
                return sendResponse(request, 400, {"message": "User is not a gym manager"}, action)
            
            cursor.execute("SELECT id FROM gyms WHERE id = %s", (gym_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Gym not found"}, action)
            
            cursor.execute("SELECT owner_id FROM gyms WHERE id = %s", (gym_id,))
            current_owner = cursor.fetchone()[0]
            
            if current_owner:
                return sendResponse(request, 400, {"message": "This gym already has a manager"}, action)
            
            cursor.execute("""
                UPDATE gyms SET owner_id = %s WHERE id = %s
                RETURNING id, name, location
            """, (user_id, gym_id))
            
            updated_gym = cursor.fetchone()
            myConn.commit()
            
            gym_data = {
                "id": updated_gym[0],
                "name": updated_gym[1],
                "location": updated_gym[2]
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, gym_data, action)
    
    except Exception as e:
        print("ASSIGN GYM TO MANAGER ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, "assign_gym_to_manager")


def get_manager_gym(request):
    """Gym manager-ийн gym-ын мэдээлэл авах"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        user_id = jsons.get('user_id')
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
    except:
        return sendResponse(request, 400, {"message": "Invalid data"}, action)
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        cursor.execute("""
            SELECT id, name, location, created_at,
                   (SELECT COUNT(*) FROM checkins WHERE gym_id = g.id AND DATE(checkin_time) = CURRENT_DATE) as today_checkins,
                   (SELECT COUNT(*) FROM checkins WHERE gym_id = g.id) as total_checkins
            FROM gyms g
            WHERE owner_id = %s
        """, (user_id,))
        
        gym = cursor.fetchone()
        
        if not gym:
            return sendResponse(request, 404, {"message": "No gym assigned"}, action)
        
        gym_data = {
            "id": gym[0],
            "name": gym[1],
            "location": gym[2],
            "created_at": str(gym[3]) if gym[3] else None,
            "today_checkins": gym[4] or 0,
            "total_checkins": gym[5] or 0
        }
        
        return sendResponse(request, 200, [gym_data], action)
        
    except Exception as e:
        print("GET MANAGER GYM ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, action)
    finally:
        disconnectDB(myConn)


def get_my_gym_stats(request):
    """Gym manager-ийн gym-ын статистик мэдээлэл"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        user_id = jsons.get('user_id')
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
    except:
        return sendResponse(request, 400, {"message": "Invalid data"}, action)
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        cursor.execute("SELECT id FROM gyms WHERE owner_id = %s", (user_id,))
        gym = cursor.fetchone()
        
        if not gym:
            return sendResponse(request, 404, {"message": "No gym assigned"}, action)
        
        gym_id = gym[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM checkins 
            WHERE gym_id = %s AND DATE(checkin_time) = CURRENT_DATE
        """, (gym_id,))
        today_checkins = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM checkins 
            WHERE gym_id = %s AND DATE(checkin_time) >= DATE_TRUNC('week', CURRENT_DATE)
        """, (gym_id,))
        week_checkins = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM checkins 
            WHERE gym_id = %s AND DATE(checkin_time) >= DATE_TRUNC('month', CURRENT_DATE)
        """, (gym_id,))
        month_checkins = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM checkins WHERE gym_id = %s", (gym_id,))
        total_checkins = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT DATE(checkin_time) as date, COUNT(*) as count
            FROM checkins 
            WHERE gym_id = %s AND checkin_time >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(checkin_time)
            ORDER BY date
        """, (gym_id,))
        
        daily_stats = []
        for row in cursor.fetchall():
            daily_stats.append({
                "date": str(row[0]),
                "count": row[1]
            })
        
        stats = {
            "today_checkins": today_checkins,
            "week_checkins": week_checkins,
            "month_checkins": month_checkins,
            "total_checkins": total_checkins,
            "daily_stats": daily_stats
        }
        
        return sendResponse(request, 200, stats, action)
        
    except Exception as e:
        print("GET MY GYM STATS ERROR:", e)
        return sendResponse(request, 500, {"error": str(e)}, action)
    finally:
        disconnectDB(myConn)


# ==================== GYM IMAGE SERVICES ====================

def upload_gym_image(request):
    """Гимнастикийн зураг оруулах"""
    action = request.POST.get('action', 'upload_gym_image')
    cursor = None
    myConn = None

    try:
        image_file = request.FILES.get('image')
        if not image_file:
            return JsonResponse(sendResponse(request, 400, {"message": "No image file"}, action), status=400)

        gym_id = request.POST.get('gym_id')
        if not gym_id:
            return JsonResponse(sendResponse(request, 400, {"message": "gym_id required"}, action), status=400)

        myConn = connectDB()
        cursor = myConn.cursor()

        # Check if this is the first image (make it main)
        cursor.execute("SELECT COUNT(*) FROM gym_images WHERE gym_id = %s", (gym_id,))
        image_count = cursor.fetchone()[0]
        is_main = image_count == 0

        # Save file
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{image_file.name}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'gym_images')
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb+') as destination:
            for chunk in image_file.chunks():
                destination.write(chunk)

        image_url = f"/media/gym_images/{filename}"

        # Insert into gym_images table
        cursor.execute("""
            INSERT INTO gym_images (gym_id, image_url, is_main, created_at)
            VALUES (%s, %s, %s, NOW())
            RETURNING id
        """, (gym_id, image_url, is_main))
        
        image_id = cursor.fetchone()[0]
        
        # ✅ IMPORTANT: Update gyms table image column
        cursor.execute("""
            UPDATE gyms SET image = %s WHERE id = %s
        """, (image_url, gym_id))
        
        myConn.commit()

        resp_data = {
            "id": image_id,
            "image_url": image_url,
            "is_main": is_main
        }
        
        return JsonResponse(sendResponse(request, 200, resp_data, action), status=200)

    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        if myConn:
            myConn.rollback()
        return JsonResponse(sendResponse(request, 500, {"error": str(e)}, action), status=500)

    finally:
        if cursor:
            cursor.close()
        if myConn:
            disconnectDB(myConn)
def get_gym_images(request):
    """Gym-ийн бүх зургийг авах"""
    action = request.POST.get('action', 'get_gym_images')
    cursor = None
    myConn = None
    
    try:
        gym_id = request.POST.get('gym_id')
        if not gym_id:
            return JsonResponse(sendResponse(request, 400, {"message": "gym_id required"}, action), status=400)
        
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Gym-ийн бүх зургийг авах
        cursor.execute("""
            SELECT id, image_url, is_main, created_at 
            FROM gym_images 
            WHERE gym_id = %s 
            ORDER BY is_main DESC, created_at DESC
        """, (gym_id,))
        
        images = cursor.fetchall()
        
        result = []
        for img in images:
            result.append({
                "id": img[0],
                "image_url": img[1],
                "is_main": img[2],
                "created_at": img[3].strftime('%Y-%m-%d %H:%M:%S') if img[3] else None
            })
        
        return JsonResponse(sendResponse(request, 200, result, action), status=200)
        
    except Exception as e:
        print(f"Error getting gym images: {str(e)}")
        return JsonResponse(sendResponse(request, 500, {"error": str(e)}, action), status=500)
    
    finally:
        if cursor:
            cursor.close()
        if myConn:
            disconnectDB(myConn)


def delete_gym_image(request):
    """Gym-ийн зургийг устгах"""
    action = request.POST.get('action', 'delete_gym_image')
    cursor = None
    myConn = None
    
    try:
        image_id = request.POST.get('image_id')
        if not image_id:
            return JsonResponse(sendResponse(request, 400, {"message": "image_id required"}, action), status=400)
        
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Зургийг устгах
        cursor.execute("DELETE FROM gym_images WHERE id = %s RETURNING id", (image_id,))
        deleted = cursor.fetchone()
        
        if not deleted:
            return JsonResponse(sendResponse(request, 404, {"message": "Image not found"}, action), status=404)
        
        myConn.commit()
        
        return JsonResponse(sendResponse(request, 200, {"message": "Image deleted successfully"}, action), status=200)
        
    except Exception as e:
        print(f"Error deleting gym image: {str(e)}")
        return JsonResponse(sendResponse(request, 500, {"error": str(e)}, action), status=500)
    
    finally:
        if cursor:
            cursor.close()
        if myConn:
            disconnectDB(myConn)


# ==================== MEMBERSHIP SERVICES ====================

def create_membership(request):
    """Шинэ гишүүнчлэл үүсгэх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_membership")
        
        user_id = data.get("user_id")
        plan_id = data.get("plan_id")
        
        if not user_id or not plan_id:
            return sendResponse(request, 400, {"message": "Missing required fields"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT duration_days FROM membership_plans WHERE id = %s", (plan_id,))
            plan = cursor.fetchone()
            
            if not plan:
                return sendResponse(request, 404, {"message": "Plan not found"}, action)
            
            start_date = datetime.now().date()
            end_date = start_date + timedelta(days=plan[0])
            
            cursor.execute("""
                UPDATE user_memberships 
                SET status = 'expired' 
                WHERE user_id = %s AND status = 'active'
            """, (user_id,))
            
            cursor.execute("""
                INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status)
                VALUES (%s, %s, %s, %s, 'active')
                RETURNING id
            """, (user_id, plan_id, start_date, end_date))
            
            membership_id = cursor.fetchone()[0]
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {
            "id": membership_id,
            "message": "Membership created successfully",
            "start_date": str(start_date),
            "end_date": str(end_date)
        }, action)
    
    except Exception as e:
        print(f"CREATE MEMBERSHIP ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "create_membership")


def get_user_memberships(request):
    """Хэрэглэгчийн гишүүнчлэлүүдийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_user_memberships")
        user_id = data.get("user_id")
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
        
        myConn = connectDB()
        membership_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT um.id, um.user_id, um.plan_id, 
                       um.start_date, um.end_date, um.status,
                       mp.name as plan_name, mp.price, mp.duration_days
                FROM user_memberships um
                JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE um.user_id = %s
                ORDER BY um.start_date DESC
            """, (user_id,))
            
            memberships = cursor.fetchall()
            for m in memberships:
                membership_dict = {
                    "id": m[0],
                    "user_id": m[1],
                    "plan_id": m[2],
                    "start_date": str(m[3]) if m[3] else None,
                    "end_date": str(m[4]) if m[4] else None,
                    "status": m[5],
                    "plan_name": m[6],
                    "plan_price": float(m[7]),
                    "duration_days": m[8]
                }
                membership_list.append(membership_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, membership_list, action)
    
    except Exception as e:
        print(f"GET USER MEMBERSHIPS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_user_memberships")


def cancel_membership(request):
    """Гишүүнчлэлийг цуцлах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "cancel_membership")
        membership_id = data.get("membership_id")
        
        if not membership_id:
            return sendResponse(request, 400, {"message": "membership_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                UPDATE user_memberships 
                SET status = 'cancelled' 
                WHERE id = %s
                RETURNING id
            """, (membership_id,))
            
            if cursor.fetchone():
                myConn.commit()
                return sendResponse(request, 200, {"message": "Membership cancelled successfully"}, action)
            else:
                return sendResponse(request, 404, {"message": "Membership not found"}, action)
        
    except Exception as e:
        print(f"CANCEL MEMBERSHIP ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "cancel_membership")


def get_all_memberships(request):
    """Бүх гишүүнчлэлийн жагсаалт (Admin)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_all_memberships")
        
        myConn = connectDB()
        membership_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT um.id, um.user_id, um.plan_id, um.start_date, um.end_date, um.status,
                       u.name as user_name, u.email as user_email,
                       mp.name as plan_name, mp.price, mp.duration_days
                FROM user_memberships um
                JOIN users u ON um.user_id = u.id
                JOIN membership_plans mp ON um.plan_id = mp.id
                ORDER BY um.created_at DESC
            """)
            
            memberships = cursor.fetchall()
            for m in memberships:
                membership_dict = {
                    "id": m[0],
                    "user_id": m[1],
                    "plan_id": m[2],
                    "start_date": str(m[3]) if m[3] else None,
                    "end_date": str(m[4]) if m[4] else None,
                    "status": m[5],
                    "user_name": m[6],
                    "user_email": m[7],
                    "plan_name": m[8],
                    "plan_price": float(m[9]),
                    "duration_days": m[10]
                }
                membership_list.append(membership_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, membership_list, action)
    
    except Exception as e:
        print(f"GET ALL MEMBERSHIPS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_all_memberships")


# ==================== CHECK-IN SERVICES ====================


def check_user_access(request):
    """Хэрэглэгчийн тухайн гимнастик руу нэвтрэх эрхийг шалгах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "check_user_access")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        
        if not user_id or not gym_id:
            return sendResponse(request, 400, {"message": "user_id and gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT um.id, um.end_date, mp.name, mp.duration_days
                FROM user_memberships um
                JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE um.user_id = %s AND um.status = 'active'
                AND CURRENT_DATE <= um.end_date
                ORDER BY um.end_date ASC
                LIMIT 1
            """, (user_id,))
            
            membership = cursor.fetchone()
            
            if not membership:
                return sendResponse(request, 200, {
                    "has_access": False,
                    "reason": "Идэвхтэй гишүүнчлэл байхгүй байна. Та эхлээд гишүүнчлэл авах шаардлагатай."
                }, action)
            
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE user_id = %s AND gym_id = %s AND DATE(checkin_time) = CURRENT_DATE
            """, (user_id, gym_id))
            
            already_checked_in = cursor.fetchone()[0] > 0
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "has_access": True,
            "membership_id": membership[0],
            "plan_name": membership[2],
            "expiry_date": str(membership[1]),
            "already_checked_in_today": already_checked_in
        }, action)
    
    except Exception as e:
        print(f"CHECK USER ACCESS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "check_user_access")


def get_user_checkins(request):
    """Хэрэглэгчийн check-in түүхийг авах (checkout мэдээлэлтэй)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_user_checkins")
        user_id = data.get("user_id")
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
        
        myConn = connectDB()
        checkin_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    c.id, 
                    c.user_id, 
                    c.gym_id, 
                    c.checkin_time,
                    c.verification_status, 
                    c.verified_at, 
                    c.notes,
                    c.checkout_time,
                    c.duration_minutes,
                    g.name as gym_name, 
                    g.location as gym_location,
                    adm.name as verified_by_name,
                    co.checkout_time as co_checkout_time,
                    co.duration_minutes as co_duration
                FROM checkins c
                JOIN gyms g ON c.gym_id = g.id
                LEFT JOIN users adm ON c.verified_by = adm.id
                LEFT JOIN checkouts co ON c.id = co.checkin_id
                WHERE c.user_id = %s
                ORDER BY c.checkin_time DESC
            """, (user_id,))
            
            checkins = cursor.fetchall()
            for c in checkins:
                # Use checkout info from checkouts table if available
                checkout_time = c[12] if c[12] else c[7]
                duration_minutes = c[13] if c[13] else (c[8] or 0)
                
                hours = duration_minutes // 60
                minutes = duration_minutes % 60
                duration_formatted = f"{hours}ц {minutes}мин" if hours > 0 else f"{minutes}мин" if minutes > 0 else None
                
                checkin_dict = {
                    "id": c[0],
                    "user_id": c[1],
                    "gym_id": c[2],
                    "checkin_time": str(c[3]) if c[3] else None,
                    "verification_status": c[4] if c[4] else 'pending',
                    "verified_at": str(c[5]) if c[5] else None,
                    "notes": c[6] or "",
                    "checkout_time": str(checkout_time) if checkout_time else None,
                    "duration_minutes": duration_minutes,
                    "duration_formatted": duration_formatted,
                    "gym_name": c[9],
                    "gym_location": c[10],
                    "verified_by_name": c[11] if c[11] else None
                }
                checkin_list.append(checkin_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, checkin_list, action)
    
    except Exception as e:
        print(f"GET USER CHECKINS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_user_checkins")


def get_gym_checkins(request):
    """Тухайн гимнастикийн өдрийн check-in-уудыг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_checkins")
        gym_id = data.get("gym_id")
        date = data.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        checkin_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT c.id, c.user_id, c.checkin_time,
                       u.name as user_name, u.email
                FROM checkins c
                JOIN users u ON c.user_id = u.id
                WHERE c.gym_id = %s AND DATE(c.checkin_time) = %s
                ORDER BY c.checkin_time DESC
            """, (gym_id, date))
            
            checkins = cursor.fetchall()
            for c in checkins:
                checkin_dict = {
                    "id": c[0],
                    "user_id": c[1],
                    "checkin_time": str(c[2]) if c[2] else None,
                    "user_name": c[3],
                    "user_email": c[4]
                }
                checkin_list.append(checkin_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, checkin_list, action)
    
    except Exception as e:
        print(f"GET GYM CHECKINS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_checkins")


def get_gym_checkin_stats(request):
    """Гимнастикийн check-in статистик"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_checkin_stats")
        gym_id = data.get("gym_id")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) = CURRENT_DATE
            """, (gym_id,))
            today_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) >= CURRENT_DATE - INTERVAL '7 days'
            """, (gym_id,))
            week_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) >= DATE_TRUNC('month', CURRENT_DATE)
            """, (gym_id,))
            month_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM checkins WHERE gym_id = %s
            """, (gym_id,))
            total_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT DATE(checkin_time) as date, COUNT(*) as count
                FROM checkins 
                WHERE gym_id = %s AND checkin_time >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(checkin_time)
                ORDER BY date
            """, (gym_id,))
            
            daily_stats = []
            for row in cursor.fetchall():
                daily_stats.append({
                    "date": str(row[0]),
                    "count": row[1]
                })
        
        disconnectDB(myConn)
        
        stats = {
            "today": today_count,
            "this_week": week_count,
            "this_month": month_count,
            "total": total_count,
            "daily_stats": daily_stats
        }
        
        return sendResponse(request, 200, stats, action)
    
    except Exception as e:
        print(f"GET GYM CHECKIN STATS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_checkin_stats")

# ==================== CHECK-IN SERVICES (UPDATED) ====================

def create_checkin(request):
    """Хэрэглэгч шууд check-in хийх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_checkin")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        notes = data.get("notes", "")
        
        print(f"DEBUG create_checkin: user_id={user_id}, gym_id={gym_id}, notes={notes}")
        
        if not user_id or not gym_id:
            return sendResponse(request, 400, {"message": "user_id and gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if user has active membership
            cursor.execute("""
                SELECT um.id, um.end_date, mp.name
                FROM user_memberships um
                JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE um.user_id = %s AND um.status = 'active' AND CURRENT_DATE <= um.end_date
                LIMIT 1
            """, (user_id,))
            
            active_membership = cursor.fetchone()
            
            if not active_membership:
                return sendResponse(request, 403, {
                    "message": "Идэвхтэй гишүүнчлэл байхгүй байна. Та эхлээд гишүүнчлэл авах шаардлагатай."
                }, action)
            
            # Check if already has pending request today
            cursor.execute("""
                SELECT id FROM checkins 
                WHERE user_id = %s AND gym_id = %s 
                AND DATE(checkin_time) = CURRENT_DATE 
                AND verification_status = 'pending'
            """, (user_id, gym_id))
            
            existing_pending = cursor.fetchone()
            if existing_pending:
                return sendResponse(request, 400, {
                    "message": "Таны хүсэлт аль хэдийн илгээгдсэн байна. Баталгаажуулахыг хүлээнэ үү."
                }, action)
            
            # Check if already verified checkin today
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE user_id = %s AND DATE(checkin_time) = CURRENT_DATE AND verification_status = 'verified'
            """, (user_id,))
            
            if cursor.fetchone()[0] > 0:
                return sendResponse(request, 400, {
                    "message": "Та өнөөдөр аль хэдий нэг удаа хүсэлт илгээсэн байна. Маргааш дахин оролдоно уу."
                }, action)
            
            # Create checkin with pending verification (using checkin_time instead of checkin_time)
            cursor.execute("""
                INSERT INTO checkins (user_id, gym_id, checkin_time, verification_status, notes)
                VALUES (%s, %s, NOW(), 'pending', %s)
                RETURNING id, checkin_time
            """, (user_id, gym_id, notes))
            
            checkin_id, created_at = cursor.fetchone()
            myConn.commit()
            
            print(f"DEBUG: Checkin created successfully with id={checkin_id}")
            
            # Get user info
            cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
            user_info = cursor.fetchone()
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "id": checkin_id,
            "message": "Орох хүсэлт амжилттай илгээгдлээ. Баталгаажуулахыг хүлээнэ үү.",
            "checkin_time": str(created_at),
            "user": {
                "name": user_info[0],
                "email": user_info[1]
            }
        }, action)
    
    except Exception as e:
        print(f"CREATE CHECKIN ERROR: {e}")
        import traceback
        traceback.print_exc()
        return sendResponse(request, 500, {"error": str(e)}, "create_checkin")
def get_today_unverified_checkins(request):
    """Gym manager-ийн өнөөдрийн баталгаажаагүй check-in-ууд"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_today_unverified_checkins")
        
        gym_manager_id = data.get("gym_manager_id")
        
        if not gym_manager_id:
            return sendResponse(request, 400, {"message": "gym_manager_id required"}, action)
        
        myConn = connectDB()
        checkin_list = []
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("""
                SELECT id, name, location FROM gyms WHERE owner_id = %s
            """, (gym_manager_id,))
            
            gym = cursor.fetchone()
            if not gym:
                return sendResponse(request, 404, {"message": "Таны удирдлага дор гимнастик байхгүй байна"}, action)
            
            gym_id, gym_name, gym_location = gym
            
            # Get today's unverified checkins
            cursor.execute("""
                SELECT c.id, c.user_id, c.checkin_time, c.notes,
                       u.name as user_name, u.email as user_email, u.phone as user_phone,
                       mp.name as plan_name, um.end_date
                FROM checkins c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN user_memberships um ON u.id = um.user_id AND um.status = 'active' AND CURRENT_DATE <= um.end_date
                LEFT JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE c.gym_id = %s 
                  AND DATE(c.checkin_time) = CURRENT_DATE 
                  AND c.verification_status = 'pending'
                ORDER BY c.checkin_time ASC
            """, (gym_id,))
            
            checkins = cursor.fetchall()
            for ch in checkins:
                checkin_dict = {
                    "id": ch[0],
                    "user_id": ch[1],
                    "checkin_time": str(ch[2]) if ch[2] else None,
                    "notes": ch[3] or "",
                    "user_name": ch[4],
                    "user_email": ch[5],
                    "user_phone": ch[6] or "",
                    "plan_name": ch[7] if ch[7] else "N/A",
                    "membership_expiry": str(ch[8]) if ch[8] else None
                }
                checkin_list.append(checkin_dict)
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "gym": {
                "id": gym_id,
                "name": gym_name,
                "location": gym_location
            },
            "checkins": checkin_list
        }, action)
    
    except Exception as e:
        print(f"GET TODAY UNVERIFIED CHECKINS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_today_unverified_checkins")


def get_all_unverified_checkins(request):
    """Gym manager-ийн бүх баталгаажаагүй check-in-ууд (огноогоор)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_all_unverified_checkins")
        
        gym_manager_id = data.get("gym_manager_id")
        date_filter = data.get("date")  # Optional date filter (YYYY-MM-DD)
        
        if not gym_manager_id:
            return sendResponse(request, 400, {"message": "gym_manager_id required"}, action)
        
        myConn = connectDB()
        result = []
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("SELECT id, name FROM gyms WHERE owner_id = %s", (gym_manager_id,))
            gym = cursor.fetchone()
            if not gym:
                return sendResponse(request, 404, {"message": "Таны удирдлага дор гимнастик байхгүй байна"}, action)
            
            gym_id, gym_name = gym
            
            # Build query
            query = """
                SELECT c.id, c.user_id, c.checkin_time, c.verification_status, c.notes,
                       u.name as user_name, u.email as user_email, u.phone as user_phone,
                       DATE(c.checkin_time) as checkin_date
                FROM checkins c
                JOIN users u ON c.user_id = u.id
                WHERE c.gym_id = %s AND c.verification_status = 'pending'
            """
            params = [gym_id]
            
            if date_filter:
                query += " AND DATE(c.checkin_time) = %s"
                params.append(date_filter)
            
            query += " ORDER BY c.checkin_time DESC"
            
            cursor.execute(query, params)
            
            checkins = cursor.fetchall()
            for ch in checkins:
                checkin_dict = {
                    "id": ch[0],
                    "user_id": ch[1],
                    "checkin_time": str(ch[2]) if ch[2] else None,
                    "verification_status": ch[3],
                    "notes": ch[4] or "",
                    "user_name": ch[5],
                    "user_email": ch[6],
                    "user_phone": ch[7] or "",
                    "checkin_date": str(ch[8]) if ch[8] else None
                }
                result.append(checkin_dict)
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "gym_name": gym_name,
            "checkins": result
        }, action)
    
    except Exception as e:
        print(f"GET ALL UNVERIFIED CHECKINS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_all_unverified_checkins")


def verify_checkin(request):
    """Gym manager check-in-г баталгаажуулах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "verify_checkin")
        
        checkin_id = data.get("checkin_id")
        verified_by = data.get("verified_by")  # gym manager user id
        
        if not checkin_id or not verified_by:
            return sendResponse(request, 400, {"message": "checkin_id and verified_by required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get checkin details
            cursor.execute("""
                SELECT c.id, c.user_id, c.gym_id, c.verification_status,
                       g.owner_id
                FROM checkins c
                JOIN gyms g ON c.gym_id = g.id
                WHERE c.id = %s
            """, (checkin_id,))
            
            checkin = cursor.fetchone()
            
            if not checkin:
                return sendResponse(request, 404, {"message": "Check-in олдсонгүй"}, action)
            
            if checkin[3] == 'verified':
                return sendResponse(request, 400, {"message": "Энэ check-in аль хэдийн баталгаажсан байна"}, action)
            
            # Check if the verifier is the gym owner
            if checkin[4] != verified_by:
                return sendResponse(request, 403, {"message": "Та энэ gym-ийн эрхлэгч биш байна"}, action)
            
            # Update checkin verification
            cursor.execute("""
                UPDATE checkins 
                SET verification_status = 'verified', 
                    verified_by = %s,
                    verified_at = NOW()
                WHERE id = %s
                RETURNING id
            """, (verified_by, checkin_id))
            
            myConn.commit()
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "checkin_id": checkin_id,
            "message": "Check-in амжилттай баталгаажлаа"
        }, action)
    
    except Exception as e:
        print(f"VERIFY CHECKIN ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "verify_checkin")


def get_verified_checkins_history(request):
    """Gym manager-ийн баталгаажсан check-in түүх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_verified_checkins_history")
        
        gym_manager_id = data.get("gym_manager_id")
        page = data.get("page", 1)
        limit = data.get("limit", 50)
        offset = (page - 1) * limit
        
        if not gym_manager_id:
            return sendResponse(request, 400, {"message": "gym_manager_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("SELECT id FROM gyms WHERE owner_id = %s", (gym_manager_id,))
            gym = cursor.fetchone()
            if not gym:
                return sendResponse(request, 404, {"message": "Таны удирдлага дор гимнастик байхгүй байна"}, action)
            
            gym_id = gym[0]
            
            # Get total count
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND verification_status = 'verified'
            """, (gym_id,))
            total = cursor.fetchone()[0]
            
            # Get verified checkins with pagination
            cursor.execute("""
                SELECT c.id, c.user_id, c.checkin_time, c.verified_at, c.notes,
                       u.name as user_name, u.email as user_email,
                       adm.name as verified_by_name
                FROM checkins c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN users adm ON c.verified_by = adm.id
                WHERE c.gym_id = %s AND c.verification_status = 'verified'
                ORDER BY c.verified_at DESC
                LIMIT %s OFFSET %s
            """, (gym_id, limit, offset))
            
            checkins = cursor.fetchall()
            result = []
            for ch in checkins:
                result.append({
                    "id": ch[0],
                    "user_id": ch[1],
                    "checkin_time": str(ch[2]) if ch[2] else None,
                    "verified_at": str(ch[3]) if ch[3] else None,
                    "notes": ch[4] or "",
                    "user_name": ch[5],
                    "user_email": ch[6],
                    "verified_by_name": ch[7]
                })
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "checkins": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }, action)
    
    except Exception as e:
        print(f"GET VERIFIED CHECKINS HISTORY ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_verified_checkins_history")



# ==================== CHECK-OUT SERVICES ====================

def create_checkout(request):
    """Хэрэглэгч gym-аас гарах (check-out)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_checkout")
        
        user_id = data.get("user_id")
        gym_manager_id = data.get("gym_manager_id")
        
        print(f"CREATE_CHECKOUT: user_id={user_id}, gym_manager_id={gym_manager_id}")
        
        if not user_id or not gym_manager_id:
            return sendResponse(request, 400, {"message": "user_id and gym_manager_id required"}, action)
        
        myConn = connectDB()
        checkout_id = None
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("SELECT id FROM gyms WHERE owner_id = %s", (gym_manager_id,))
            gym = cursor.fetchone()
            
            if not gym:
                return sendResponse(request, 404, {"message": "Gym not found"}, action)
            
            gym_id = gym[0]
            print(f"CREATE_CHECKOUT: gym_id={gym_id}")
            
            # Find active checkin
            cursor.execute("""
                SELECT c.id, c.checkin_time
                FROM checkins c
                WHERE c.user_id = %s 
                  AND c.gym_id = %s 
                  AND DATE(c.checkin_time) = CURRENT_DATE
                  AND (c.checkout_status IS NULL OR c.checkout_status = 'active')
                ORDER BY c.checkin_time DESC
                LIMIT 1
            """, (user_id, gym_id))
            
            checkin = cursor.fetchone()
            print(f"CREATE_CHECKOUT: checkin found = {checkin}")
            
            if not checkin:
                return sendResponse(request, 404, {
                    "message": "Идэвхтэй check-in олдсонгүй."
                }, action)
            
            checkin_id = checkin[0]
            checkin_time = checkin[1]
            
            print(f"CREATE_CHECKOUT: checkin_time={checkin_time}, now={datetime.now()}")
            
            # Calculate duration in minutes
            now = datetime.now()
            duration = int((now - checkin_time).total_seconds() / 60)
            print(f"CREATE_CHECKOUT: duration={duration} minutes")
            
            # Update checkin with checkout info
            cursor.execute("""
                UPDATE checkins 
                SET checkout_status = 'checked_out',
                    checkout_time = NOW(),
                    duration_minutes = %s
                WHERE id = %s
            """, (duration, checkin_id))
            
            myConn.commit()
            
            # Verify update
            cursor.execute("""
                SELECT checkout_status, checkout_time, duration_minutes 
                FROM checkins WHERE id = %s
            """, (checkin_id,))
            updated = cursor.fetchone()
            print(f"CREATE_CHECKOUT: updated checkin = {updated}")
            
            # ========== INSERT INTO CHECKOUTS TABLE ==========
            try:
                # First check if checkouts table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'checkouts'
                    )
                """)
                table_exists = cursor.fetchone()[0]
                
                if table_exists:
                    # Insert into checkouts table
                    cursor.execute("""
                        INSERT INTO checkouts (checkin_id, user_id, gym_id, checkout_time, duration_minutes)
                        VALUES (%s, %s, %s, NOW(), %s)
                        RETURNING id
                    """, (checkin_id, user_id, gym_id, duration))
                    
                    checkout_id = cursor.fetchone()[0]
                    myConn.commit()
                    print(f"CREATE_CHECKOUT: inserted into checkouts table with id={checkout_id}")
                else:
                    print("CREATE_CHECKOUT: checkouts table does not exist, skipping insert")
                    
            except Exception as e:
                print(f"CREATE_CHECKOUT: Error inserting into checkouts table: {e}")
                # Don't fail the whole operation if checkouts table has issues
                pass
            
            # Format duration
            hours = duration // 60
            minutes = duration % 60
            duration_str = f"{hours}ц {minutes}мин" if hours > 0 else f"{minutes}мин"
            
            # Get user name
            cursor.execute("SELECT name FROM users WHERE id = %s", (user_id,))
            user_info = cursor.fetchone()
            user_name = user_info[0] if user_info else "Хэрэглэгч"
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "checkin_id": checkin_id,
            "checkout_id": checkout_id,
            "duration_minutes": duration,
            "duration_formatted": duration_str,
            "user_name": user_name,
            "message": f"{user_name} амжилттай гарлаа. Нийт {duration_str} дасгал хийсэн."
        }, action)
    
    except Exception as e:
        print(f"CREATE CHECKOUT ERROR: {e}")
        import traceback
        traceback.print_exc()
        return sendResponse(request, 500, {"error": str(e)}, "create_checkout")



def get_active_checkin(request):
    """Хэрэглэгчийн идэвхтэй check-in-ийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_active_checkin")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            query = """
                SELECT c.id, c.user_id, c.gym_id, c.checkin_time,
                       c.verification_status, c.verified_at, c.checkout_status,
                       g.name as gym_name, g.location as gym_location
                FROM checkins c
                JOIN gyms g ON c.gym_id = g.id
                WHERE c.user_id = %s 
                  AND c.checkout_status = 'active'
                  AND DATE(c.checkin_time) = CURRENT_DATE
            """
            params = [user_id]
            
            if gym_id:
                query += " AND c.gym_id = %s"
                params.append(gym_id)
            
            query += " ORDER BY c.checkin_time DESC LIMIT 1"
            
            cursor.execute(query, params)
            
            checkin = cursor.fetchone()
            
            if checkin:
                result = {
                    "has_active": True,
                    "checkin_id": checkin[0],
                    "user_id": checkin[1],
                    "gym_id": checkin[2],
                    "checkin_time": str(checkin[3]) if checkin[3] else None,
                    "verification_status": checkin[4],
                    "verified_at": str(checkin[5]) if checkin[5] else None,
                    "checkout_status": checkin[6],
                    "gym_name": checkin[7],
                    "gym_location": checkin[8]
                }
            else:
                result = {"has_active": False}
        
        disconnectDB(myConn)
        return sendResponse(request, 200, result, action)
    
    except Exception as e:
        print(f"GET ACTIVE CHECKIN ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_active_checkin")


def get_gym_active_checkins(request):
    """Gym-ийн идэвхтэй check-in-уудын жагсаалт (Gym manager)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_active_checkins")
        
        gym_manager_id = data.get("gym_manager_id")
        
        if not gym_manager_id:
            return sendResponse(request, 400, {"message": "gym_manager_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("SELECT id, name FROM gyms WHERE owner_id = %s", (gym_manager_id,))
            gym = cursor.fetchone()
            
            if not gym:
                return sendResponse(request, 404, {"message": "Гимнастик олдсонгүй"}, action)
            
            gym_id = gym[0]
            gym_name = gym[1]
            
            # Get active checkins
            cursor.execute("""
                SELECT c.id, c.user_id, c.checkin_time,
                       u.name as user_name, u.email as user_email, u.phone as user_phone,
                       EXTRACT(EPOCH FROM (NOW() - c.checkin_time)) / 60 as duration_minutes
                FROM checkins c
                JOIN users u ON c.user_id = u.id
                WHERE c.gym_id = %s 
                  AND c.checkout_status = 'active'
                  AND DATE(c.checkin_time) = CURRENT_DATE
                ORDER BY c.checkin_time ASC
            """, (gym_id,))
            
            checkins = cursor.fetchall()
            result = []
            for ch in checkins:
                duration_min = int(ch[6] or 0)
                hours = duration_min // 60
                minutes = duration_min % 60
                
                result.append({
                    "id": ch[0],
                    "user_id": ch[1],
                    "checkin_time": str(ch[2]) if ch[2] else None,
                    "user_name": ch[3],
                    "user_email": ch[4],
                    "user_phone": ch[5] or "",
                    "duration_minutes": duration_min,
                    "duration_formatted": f"{hours}ц {minutes}мин" if hours > 0 else f"{minutes}мин"
                })
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "gym_id": gym_id,
            "gym_name": gym_name,
            "checkins": result,
            "total_active": len(result)
        }, action)
    
    except Exception as e:
        print(f"GET GYM ACTIVE CHECKINS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_active_checkins")


# services.py - Нэмэх хэсгүүд

# ==================== REVIEW & RATING SERVICES ====================

def create_review(request):
    """Фитнес төвд үнэлгээ, сэтгэгдэл нэмэх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_review")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        rating = data.get("rating")
        comment = data.get("comment", "").strip()
        
        if not user_id or not gym_id:
            return sendResponse(request, 400, {"message": "user_id and gym_id required"}, action)
        
        if not rating or rating < 1 or rating > 5:
            return sendResponse(request, 400, {"message": "Rating must be between 1 and 5"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if user has at least one verified checkin at this gym
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE user_id = %s AND gym_id = %s AND verification_status = 'verified'
            """, (user_id, gym_id))
            
            verified_checkins = cursor.fetchone()[0]
            
            if verified_checkins == 0:
                return sendResponse(request, 403, {
                    "message": "Та энэ фитнес төвд дор хаяж нэг удаа баталгаажсан дасгал хийсэн байх шаардлагатай"
                }, action)
            
            # Check if user already reviewed this gym
            cursor.execute("""
                SELECT id FROM gym_reviews 
                WHERE user_id = %s AND gym_id = %s
            """, (user_id, gym_id))
            
            existing_review = cursor.fetchone()
            
            if existing_review:
                # Update existing review
                cursor.execute("""
                    UPDATE gym_reviews 
                    SET rating = %s, comment = %s, updated_at = NOW()
                    WHERE user_id = %s AND gym_id = %s
                    RETURNING id, rating, comment, created_at, updated_at
                """, (rating, comment, user_id, gym_id))
                
                updated_review = cursor.fetchone()
                myConn.commit()
                
                review_data = {
                    "id": updated_review[0],
                    "rating": updated_review[1],
                    "comment": updated_review[2],
                    "created_at": str(updated_review[3]) if updated_review[3] else None,
                    "updated_at": str(updated_review[4]) if updated_review[4] else None,
                    "is_updated": True
                }
            else:
                # Create new review
                cursor.execute("""
                    INSERT INTO gym_reviews (user_id, gym_id, rating, comment, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                    RETURNING id, rating, comment, created_at, updated_at
                """, (user_id, gym_id, rating, comment))
                
                new_review = cursor.fetchone()
                myConn.commit()
                
                review_data = {
                    "id": new_review[0],
                    "rating": new_review[1],
                    "comment": new_review[2],
                    "created_at": str(new_review[3]) if new_review[3] else None,
                    "updated_at": str(new_review[4]) if new_review[4] else None,
                    "is_updated": False
                }
            
            # Update gym average rating
            cursor.execute("""
                UPDATE gyms 
                SET average_rating = (
                    SELECT AVG(rating)::DECIMAL(3,2) FROM gym_reviews WHERE gym_id = %s
                ),
                total_reviews = (
                    SELECT COUNT(*) FROM gym_reviews WHERE gym_id = %s
                )
                WHERE id = %s
            """, (gym_id, gym_id, gym_id))
            
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, review_data, action)
    
    except Exception as e:
        print(f"CREATE REVIEW ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "create_review")


def get_gym_reviews(request):
    """Фитнес төвийн бүх үнэлгээ, сэтгэгдлийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_reviews")
        
        gym_id = data.get("gym_id")
        page = data.get("page", 1)
        limit = data.get("limit", 20)
        offset = (page - 1) * limit
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get gym info with average rating
            cursor.execute("""
                SELECT id, name, location, average_rating, total_reviews
                FROM gyms WHERE id = %s
            """, (gym_id,))
            
            gym = cursor.fetchone()
            if not gym:
                return sendResponse(request, 404, {"message": "Gym not found"}, action)
            
            gym_info = {
                "id": gym[0],
                "name": gym[1],
                "location": gym[2],
                "average_rating": float(gym[3]) if gym[3] else 0,
                "total_reviews": gym[4] or 0
            }
            
            # Get rating distribution
            cursor.execute("""
                SELECT rating, COUNT(*) as count
                FROM gym_reviews
                WHERE gym_id = %s
                GROUP BY rating
                ORDER BY rating DESC
            """, (gym_id,))
            
            rating_distribution = {}
            for row in cursor.fetchall():
                rating_distribution[str(row[0])] = row[1]
            
            # Get reviews with user info
            cursor.execute("""
                SELECT gr.id, gr.rating, gr.comment, gr.created_at, gr.updated_at,
                       u.id as user_id, u.name as user_name
                FROM gym_reviews gr
                JOIN users u ON gr.user_id = u.id
                WHERE gr.gym_id = %s
                ORDER BY gr.created_at DESC
                LIMIT %s OFFSET %s
            """, (gym_id, limit, offset))
            
            reviews = []
            for row in cursor.fetchall():
                reviews.append({
                    "id": row[0],
                    "rating": row[1],
                    "comment": row[2] or "",
                    "created_at": str(row[3]) if row[3] else None,
                    "updated_at": str(row[4]) if row[4] else None,
                    "user": {
                        "id": row[5],
                        "name": row[6]
                    }
                })
            
            # Get total count for pagination
            cursor.execute("SELECT COUNT(*) FROM gym_reviews WHERE gym_id = %s", (gym_id,))
            total = cursor.fetchone()[0]
        
        disconnectDB(myConn)
        
        return sendResponse(request, 200, {
            "gym": gym_info,
            "rating_distribution": rating_distribution,
            "reviews": reviews,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }, action)
    
    except Exception as e:
        print(f"GET GYM REVIEWS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_reviews")


def get_user_reviews(request):
    """Хэрэглэгчийн бичсэн бүх үнэлгээ, сэтгэгдлийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_user_reviews")
        
        user_id = data.get("user_id")
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT gr.id, gr.rating, gr.comment, gr.created_at, gr.updated_at,
                       g.id as gym_id, g.name as gym_name, g.location as gym_location,
                       g.average_rating as gym_avg_rating
                FROM gym_reviews gr
                JOIN gyms g ON gr.gym_id = g.id
                WHERE gr.user_id = %s
                ORDER BY gr.created_at DESC
            """, (user_id,))
            
            reviews = []
            for row in cursor.fetchall():
                reviews.append({
                    "id": row[0],
                    "rating": row[1],
                    "comment": row[2] or "",
                    "created_at": str(row[3]) if row[3] else None,
                    "updated_at": str(row[4]) if row[4] else None,
                    "gym": {
                        "id": row[5],
                        "name": row[6],
                        "location": row[7],
                        "average_rating": float(row[8]) if row[8] else 0
                    }
                })
        
        disconnectDB(myConn)
        return sendResponse(request, 200, reviews, action)
    
    except Exception as e:
        print(f"GET USER REVIEWS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_user_reviews")


def delete_review(request):
    """Хэрэглэгчийн бичсэн сэтгэгдлийг устгах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "delete_review")
        
        review_id = data.get("review_id")
        user_id = data.get("user_id")
        
        if not review_id:
            return sendResponse(request, 400, {"message": "review_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if review exists and belongs to user
            cursor.execute("""
                SELECT id, gym_id FROM gym_reviews 
                WHERE id = %s AND user_id = %s
            """, (review_id, user_id))
            
            review = cursor.fetchone()
            
            if not review:
                return sendResponse(request, 404, {"message": "Review not found or access denied"}, action)
            
            gym_id = review[1]
            
            # Delete review
            cursor.execute("DELETE FROM gym_reviews WHERE id = %s", (review_id,))
            myConn.commit()
            
            # Update gym average rating
            cursor.execute("""
                UPDATE gyms 
                SET average_rating = (
                    SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0) 
                    FROM gym_reviews WHERE gym_id = %s
                ),
                total_reviews = (
                    SELECT COUNT(*) FROM gym_reviews WHERE gym_id = %s
                )
                WHERE id = %s
            """, (gym_id, gym_id, gym_id))
            
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"message": "Review deleted successfully"}, action)
    
    except Exception as e:
        print(f"DELETE REVIEW ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "delete_review")


def get_top_rated_gyms(request):
    """Хамгийн өндөр үнэлгээтэй фитнес төвүүдийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_top_rated_gyms")
        
        limit = data.get("limit", 10)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, location, image, average_rating, total_reviews,
                       created_at
                FROM gyms
                WHERE total_reviews > 0
                ORDER BY average_rating DESC, total_reviews DESC
                LIMIT %s
            """, (limit,))
            
            gyms = cursor.fetchall()
            gym_list = []
            for gym in gyms:
                gym_list.append({
                    "id": gym[0],
                    "name": gym[1],
                    "location": gym[2],
                    "image": gym[3] if gym[3] else None,
                    "average_rating": float(gym[4]) if gym[4] else 0,
                    "total_reviews": gym[5] or 0,
                    "created_at": str(gym[6]) if gym[6] else None
                })
        
        disconnectDB(myConn)
        return sendResponse(request, 200, gym_list, action)
    
    except Exception as e:
        print(f"GET TOP RATED GYMS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_top_rated_gyms")


def can_user_review(request):
    """Хэрэглэгч тухайн фитнес төвд сэтгэгдэл бичих эрхтэй эсэхийг шалгах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "can_user_review")
        
        user_id = data.get("user_id")
        gym_id = data.get("gym_id")
        
        if not user_id or not gym_id:
            return sendResponse(request, 400, {"message": "user_id and gym_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if user has verified checkins
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE user_id = %s AND gym_id = %s AND verification_status = 'verified'
            """, (user_id, gym_id))
            
            has_checked_in = cursor.fetchone()[0] > 0
            
            # Check if user already reviewed
            cursor.execute("""
                SELECT id, rating, comment FROM gym_reviews 
                WHERE user_id = %s AND gym_id = %s
            """, (user_id, gym_id))
            
            existing_review = cursor.fetchone()
            
            can_review = has_checked_in
            has_reviewed = existing_review is not None
            
            result = {
                "can_review": can_review,
                "has_reviewed": has_reviewed,
                "message": "Та энэ фитнес төвд сэтгэгдэл бичих боломжтой" if can_review and not has_reviewed else (
                    "Та сэтгэгдлээ засварлах боломжтой" if has_reviewed else 
                    "Та энэ фитнес төвд сэтгэгдэл бичихийн тулд дор хаяж нэг удаа дасгал хийсэн байх шаардлагатай"
                )
            }
            
            if existing_review:
                result["existing_review"] = {
                    "id": existing_review[0],
                    "rating": existing_review[1],
                    "comment": existing_review[2] or ""
                }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, result, action)
    
    except Exception as e:
        print(f"CAN USER REVIEW ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "can_user_review")

# ==================== REPLY TO REVIEW SERVICES ====================

def add_reply_to_review(request):
    """Сэтгэгдэлд хариу бичих (Зөвхөн gym manager)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "add_reply_to_review")
        
        review_id = data.get("review_id")
        gym_manager_id = data.get("gym_manager_id")
        reply_text = data.get("reply", "").strip()
        
        if not review_id or not gym_manager_id or not reply_text:
            return sendResponse(request, 400, {"message": "review_id, gym_manager_id, reply are required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if gym manager owns this gym
            cursor.execute("""
                SELECT gr.id, gr.gym_id, g.owner_id
                FROM gym_reviews gr
                JOIN gyms g ON gr.gym_id = g.id
                WHERE gr.id = %s
            """, (review_id,))
            
            review = cursor.fetchone()
            
            if not review:
                return sendResponse(request, 404, {"message": "Review not found"}, action)
            
            if review[2] != gym_manager_id:
                return sendResponse(request, 403, {"message": "Та энэ gym-ийн эрхлэгч биш байна"}, action)
            
            # Check if reply already exists
            cursor.execute("SELECT id FROM review_replies WHERE review_id = %s", (review_id,))
            existing_reply = cursor.fetchone()
            
            if existing_reply:
                # Update existing reply
                cursor.execute("""
                    UPDATE review_replies 
                    SET reply_text = %s, updated_at = NOW()
                    WHERE review_id = %s
                    RETURNING id, reply_text, created_at, updated_at
                """, (reply_text, review_id))
            else:
                # Create new reply
                cursor.execute("""
                    INSERT INTO review_replies (review_id, gym_manager_id, reply_text, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    RETURNING id, reply_text, created_at, updated_at
                """, (review_id, gym_manager_id, reply_text))
            
            reply = cursor.fetchone()
            myConn.commit()
            
            reply_data = {
                "id": reply[0],
                "reply_text": reply[1],
                "created_at": str(reply[2]) if reply[2] else None,
                "updated_at": str(reply[3]) if reply[3] else None
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, reply_data, action)
    
    except Exception as e:
        print(f"ADD REPLY TO REVIEW ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "add_reply_to_review")


def get_review_replies(request):
    """Сэтгэгдлийн хариуг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_review_replies")
        
        review_id = data.get("review_id")
        
        if not review_id:
            return sendResponse(request, 400, {"message": "review_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT rr.id, rr.reply_text, rr.created_at, rr.updated_at,
                       u.id as manager_id, u.name as manager_name
                FROM review_replies rr
                JOIN users u ON rr.gym_manager_id = u.id
                WHERE rr.review_id = %s
            """, (review_id,))
            
            reply = cursor.fetchone()
            
            if reply:
                reply_data = {
                    "id": reply[0],
                    "reply_text": reply[1],
                    "created_at": str(reply[2]) if reply[2] else None,
                    "updated_at": str(reply[3]) if reply[3] else None,
                    "manager": {
                        "id": reply[4],
                        "name": reply[5]
                    }
                }
            else:
                reply_data = None
        
        disconnectDB(myConn)
        return sendResponse(request, 200, reply_data, action)
    
    except Exception as e:
        print(f"GET REVIEW REPLIES ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_review_replies")


def delete_reply(request):
    """Сэтгэгдлийн хариуг устгах (Зөвхөн gym manager)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "delete_reply")
        
        reply_id = data.get("reply_id")
        gym_manager_id = data.get("gym_manager_id")
        
        if not reply_id or not gym_manager_id:
            return sendResponse(request, 400, {"message": "reply_id and gym_manager_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Check if reply belongs to this gym manager
            cursor.execute("""
                SELECT id FROM review_replies 
                WHERE id = %s AND gym_manager_id = %s
            """, (reply_id, gym_manager_id))
            
            reply = cursor.fetchone()
            
            if not reply:
                return sendResponse(request, 404, {"message": "Reply not found or access denied"}, action)
            
            cursor.execute("DELETE FROM review_replies WHERE id = %s", (reply_id,))
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"message": "Reply deleted successfully"}, action)
    
    except Exception as e:
        print(f"DELETE REPLY ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "delete_reply")






# ==================== PLAN SERVICES ====================

def get_all_plans(request):
    """Бүх төлөвлөгөөнүүдийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_all_plans")
        
        myConn = connectDB()
        plan_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, price, duration_days
                FROM membership_plans
                ORDER BY price
            """)
            
            plans = cursor.fetchall()
            for plan in plans:
                plan_dict = {
                    "id": plan[0],
                    "name": plan[1],
                    "price": float(plan[2]),
                    "duration_days": plan[3]
                }
                plan_list.append(plan_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, plan_list, action)
    
    except Exception as e:
        print(f"GET ALL PLANS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_all_plans")


def create_plan(request):
    """Шинэ төлөвлөгөө үүсгэх"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "create_plan")
        
        name = data.get("name", "").strip()
        price = data.get("price")
        duration_days = data.get("duration_days")
        
        if not name:
            return sendResponse(request, 400, {"message": "Төлөвлөгөөний нэр шаардлагатай"}, action)
        if not price or price <= 0:
            return sendResponse(request, 400, {"message": "Үнэ зөв оруулна уу"}, action)
        if not duration_days or duration_days <= 0:
            return sendResponse(request, 400, {"message": "Хугацаа зөв оруулна уу"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM membership_plans WHERE name = %s", (name,))
            if cursor.fetchone():
                return sendResponse(request, 400, {"message": "Энэ нэртэй төлөвлөгөө аль хэдийн бүртгэлтэй байна"}, action)
            
            cursor.execute("""
                INSERT INTO membership_plans (name, price, duration_days)
                VALUES (%s, %s, %s)
                RETURNING id, name, price, duration_days
            """, (name, price, duration_days))
            
            new_plan = cursor.fetchone()
            myConn.commit()
            
            plan_data = {
                "id": new_plan[0],
                "name": new_plan[1],
                "price": float(new_plan[2]),
                "duration_days": new_plan[3]
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, plan_data, action)
    
    except Exception as e:
        print(f"CREATE PLAN ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "create_plan")


def update_plan(request):
    """Төлөвлөгөө засварлах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "update_plan")
        
        plan_id = data.get("plan_id")
        name = data.get("name")
        price = data.get("price")
        duration_days = data.get("duration_days")
        
        if not plan_id:
            return sendResponse(request, 400, {"message": "plan_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM membership_plans WHERE id = %s", (plan_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Төлөвлөгөө олдсонгүй"}, action)
            
            update_fields = []
            params = []
            
            if name:
                update_fields.append("name = %s")
                params.append(name)
            if price:
                update_fields.append("price = %s")
                params.append(price)
            if duration_days:
                update_fields.append("duration_days = %s")
                params.append(duration_days)
            
            if update_fields:
                params.append(plan_id)
                query = f"""
                    UPDATE membership_plans 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, name, price, duration_days
                """
                cursor.execute(query, params)
                updated_plan = cursor.fetchone()
                myConn.commit()
                
                plan_data = {
                    "id": updated_plan[0],
                    "name": updated_plan[1],
                    "price": float(updated_plan[2]),
                    "duration_days": updated_plan[3]
                }
            else:
                cursor.execute("SELECT id, name, price, duration_days FROM membership_plans WHERE id = %s", (plan_id,))
                plan = cursor.fetchone()
                plan_data = {
                    "id": plan[0],
                    "name": plan[1],
                    "price": float(plan[2]),
                    "duration_days": plan[3]
                }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, plan_data, action)
    
    except Exception as e:
        print(f"UPDATE PLAN ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "update_plan")


def delete_plan(request):
    """Төлөвлөгөө устгах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "delete_plan")
        plan_id = data.get("plan_id")
        
        if not plan_id:
            return sendResponse(request, 400, {"message": "plan_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM membership_plans WHERE id = %s", (plan_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Төлөвлөгөө олдсонгүй"}, action)
            
            cursor.execute("DELETE FROM membership_plans WHERE id = %s", (plan_id,))
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"message": "Төлөвлөгөө амжилттай устгагдлаа"}, action)
    
    except Exception as e:
        print(f"DELETE PLAN ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "delete_plan")


# ==================== PLAN-GYM ASSIGNMENT SERVICES ====================

def assign_plan_to_gym(request):
    """Төлөвлөгөөг гимнастикт оноох"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "assign_plan_to_gym")
        
        plan_id = data.get("plan_id")
        gym_id = data.get("gym_id")
        
        if not plan_id or not gym_id:
            return sendResponse(request, 400, {"message": "plan_id болон gym_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT id FROM membership_plans WHERE id = %s", (plan_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Төлөвлөгөө олдсонгүй"}, action)
            
            cursor.execute("SELECT id FROM gyms WHERE id = %s", (gym_id,))
            if not cursor.fetchone():
                return sendResponse(request, 404, {"message": "Гимнастик олдсонгүй"}, action)
            
            cursor.execute("""
                SELECT id FROM plan_gyms WHERE plan_id = %s AND gym_id = %s
            """, (plan_id, gym_id))
            if cursor.fetchone():
                return sendResponse(request, 400, {"message": "Энэ төлөвлөгөө аль хэдийн энэ гимнастикт оноогдсон байна"}, action)
            
            cursor.execute("""
                INSERT INTO plan_gyms (plan_id, gym_id)
                VALUES (%s, %s)
                RETURNING id
            """, (plan_id, gym_id))
            
            assignment_id = cursor.fetchone()[0]
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"id": assignment_id, "plan_id": plan_id, "gym_id": gym_id}, action)
    
    except Exception as e:
        print(f"ASSIGN PLAN TO GYM ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "assign_plan_to_gym")


def remove_plan_from_gym(request):
    """Гимнастикаас төлөвлөгөөг хасах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "remove_plan_from_gym")
        
        plan_id = data.get("plan_id")
        gym_id = data.get("gym_id")
        
        if not plan_id or not gym_id:
            return sendResponse(request, 400, {"message": "plan_id болон gym_id шаардлагатай"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                DELETE FROM plan_gyms WHERE plan_id = %s AND gym_id = %s
            """, (plan_id, gym_id))
            myConn.commit()
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {"message": "Төлөвлөгөө гимнастикаас амжилттай хасагдлаа"}, action)
    
    except Exception as e:
        print(f"REMOVE PLAN FROM GYM ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "remove_plan_from_gym")


def get_gym_plans(request):
    """Гимнастикийн төлөвлөгөөнүүдийг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_plans")
        gym_id = data.get("gym_id")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        plan_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT mp.id, mp.name, mp.price, mp.duration_days
                FROM membership_plans mp
                JOIN plan_gyms pg ON mp.id = pg.plan_id
                WHERE pg.gym_id = %s
                ORDER BY mp.price
            """, (gym_id,))
            
            plans = cursor.fetchall()
            for plan in plans:
                plan_dict = {
                    "id": plan[0],
                    "name": plan[1],
                    "price": float(plan[2]),
                    "duration_days": plan[3]
                }
                plan_list.append(plan_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, plan_list, action)
    
    except Exception as e:
        print(f"GET GYM PLANS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_plans")


def get_plan_gyms(request):
    """Тухайн төлөвлөгөөтэй холбоотой бүх гимнастикуудыг авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_plan_gyms")
        plan_id = data.get("plan_id")
        
        if not plan_id:
            return sendResponse(request, 400, {"message": "plan_id required"}, action)
        
        myConn = connectDB()
        gym_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, g.name, g.location
                FROM gyms g
                JOIN plan_gyms pg ON g.id = pg.gym_id
                WHERE pg.plan_id = %s
                ORDER BY g.name
            """, (plan_id,))
            
            gyms = cursor.fetchall()
            for gym in gyms:
                gym_dict = {
                    "id": gym[0],
                    "name": gym[1],
                    "location": gym[2]
                }
                gym_list.append(gym_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, gym_list, action)
    
    except Exception as e:
        print(f"GET PLAN GYMS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_plan_gyms")


# ==================== DASHBOARD STATS ====================

def get_dashboard_stats(request):
    """Dashboard статистик мэдээлэл (Admin)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_dashboard_stats")
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM gyms")
            total_gyms = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM user_memberships 
                WHERE status = 'active' AND end_date >= CURRENT_DATE
            """)
            active_memberships = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM membership_plans")
            total_plans = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM checkins WHERE DATE(checkin_time) = CURRENT_DATE
            """)
            today_checkins = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM checkins")
            total_checkins = cursor.fetchone()[0]
            
            stats = {
                "total_users": total_users,
                "total_gyms": total_gyms,
                "active_memberships": active_memberships,
                "total_plans": total_plans,
                "today_checkins": today_checkins,
                "total_checkins": total_checkins,
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, stats, action)
    
    except Exception as e:
        print(f"GET DASHBOARD STATS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_dashboard_stats")


# services.py дээр нэмэх функцүүд

def get_gym_attendance(request):
    """Gym-ийн ирцийн мэдээллийг огноогоор авах (түүх) - checkouts хүснэгтээс"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_attendance")
        
        gym_manager_id = data.get("gym_manager_id")
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        
        if not gym_manager_id:
            return sendResponse(request, 400, {"message": "gym_manager_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("SELECT id, name FROM gyms WHERE owner_id = %s", (gym_manager_id,))
            gym = cursor.fetchone()
            
            if not gym:
                disconnectDB(myConn)
                return sendResponse(request, 404, {"message": "Гимнастик олдсонгүй"}, action)
            
            gym_id = gym[0]
            gym_name = gym[1]
            
            # Get history from checkouts table
            query = """
                SELECT 
                    co.id,
                    co.user_id,
                    co.checkin_id,
                    co.checkout_time,
                    co.duration_minutes,
                    c.checkin_time,
                    u.name as user_name,
                    u.email as user_email,
                    u.phone as user_phone,
                    adm.name as verified_by_name
                FROM checkouts co
                INNER JOIN checkins c ON co.checkin_id = c.id
                INNER JOIN users u ON co.user_id = u.id
                LEFT JOIN users adm ON c.verified_by = adm.id
                WHERE co.gym_id = %s
            """
            params = [gym_id]
            
            if start_date:
                query += " AND DATE(co.checkout_time) >= %s"
                params.append(start_date)
            
            if end_date:
                query += " AND DATE(co.checkout_time) <= %s"
                params.append(end_date)
            
            query += " ORDER BY co.checkout_time DESC LIMIT 100"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                duration_min = row[4] or 0
                hours = duration_min // 60
                minutes = duration_min % 60
                duration_formatted = f"{hours}ц {minutes}мин" if hours > 0 else f"{minutes}мин"
                
                result.append({
                    "id": row[0],
                    "user_id": row[1],
                    "checkin_id": row[2],
                    "checkout_time": str(row[3]) if row[3] else None,
                    "duration_minutes": duration_min,
                    "duration_formatted": duration_formatted,
                    "checkin_time": str(row[5]) if row[5] else None,
                    "user_name": row[6],
                    "user_email": row[7],
                    "user_phone": row[8] or "",
                    "verified_by_name": row[9] if row[9] else None
                })
        
        disconnectDB(myConn)
        return sendResponse(request, 200, {
            "gym_id": gym_id,
            "gym_name": gym_name,
            "history": result,
            "total": len(result)
        }, action)
    
    except Exception as e:
        print(f"GET GYM ATTENDANCE ERROR: {e}")
        import traceback
        traceback.print_exc()
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_attendance")

def get_attendance_report(request):
    """Ирцийн тайланг өдөр, долоо хоног, сараар авах"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_attendance_report")
        
        gym_id = data.get("gym_id")
        period = data.get("period", "daily")  # daily, weekly, monthly
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        report_data = []
        
        with myConn.cursor() as cursor:
            if period == 'daily':
                # Last 30 days
                cursor.execute("""
                    SELECT DATE(checkin_time) as date, 
                           COUNT(*) as total_count,
                           SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
                           SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_count
                    FROM checkins
                    WHERE gym_id = %s 
                      AND checkin_time >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(checkin_time)
                    ORDER BY date ASC
                """, (gym_id,))
                
            elif period == 'weekly':
                # Last 12 weeks
                cursor.execute("""
                    SELECT DATE_TRUNC('week', checkin_time) as week,
                           COUNT(*) as total_count,
                           SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
                           SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_count
                    FROM checkins
                    WHERE gym_id = %s 
                      AND checkin_time >= NOW() - INTERVAL '12 weeks'
                    GROUP BY DATE_TRUNC('week', checkin_time)
                    ORDER BY week ASC
                """, (gym_id,))
                
            elif period == 'monthly':
                # Last 12 months
                cursor.execute("""
                    SELECT DATE_TRUNC('month', checkin_time) as month,
                           COUNT(*) as total_count,
                           SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
                           SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_count
                    FROM checkins
                    WHERE gym_id = %s 
                      AND checkin_time >= NOW() - INTERVAL '12 months'
                    GROUP BY DATE_TRUNC('month', checkin_time)
                    ORDER BY month ASC
                """, (gym_id,))
            
            rows = cursor.fetchall()
            for row in rows:
                report_dict = {
                    "date": str(row[0]) if row[0] else None,
                    "count": row[1] or 0,
                    "verified_count": row[2] or 0,
                    "pending_count": row[3] or 0
                }
                report_data.append(report_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, report_data, action)
    
    except Exception as e:
        print(f"GET ATTENDANCE REPORT ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_attendance_report")


def get_my_gym_stats(request):
    """Gym manager-ийн gym-ын статистик мэдээлэл"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_my_gym_stats")
        
        user_id = data.get("user_id")
        
        if not user_id:
            return sendResponse(request, 400, {"message": "user_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get manager's gym
            cursor.execute("""
                SELECT id FROM gyms WHERE owner_id = %s
            """, (user_id,))
            
            gym = cursor.fetchone()
            if not gym:
                return sendResponse(request, 404, {"message": "Таны удирдлага дор гимнастик байхгүй байна"}, action)
            
            gym_id = gym[0]
            
            # Today's checkins
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) = CURRENT_DATE
            """, (gym_id,))
            today_checkins = cursor.fetchone()[0]
            
            # This week's checkins
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) >= DATE_TRUNC('week', CURRENT_DATE)
            """, (gym_id,))
            week_checkins = cursor.fetchone()[0]
            
            # This month's checkins
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND DATE(checkin_time) >= DATE_TRUNC('month', CURRENT_DATE)
            """, (gym_id,))
            month_checkins = cursor.fetchone()[0]
            
            # Total checkins
            cursor.execute("SELECT COUNT(*) FROM checkins WHERE gym_id = %s", (gym_id,))
            total_checkins = cursor.fetchone()[0]
            
            # Pending verifications
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND verification_status = 'pending'
            """, (gym_id,))
            pending_verifications = cursor.fetchone()[0]
            
            # Verified checkins
            cursor.execute("""
                SELECT COUNT(*) FROM checkins 
                WHERE gym_id = %s AND verification_status = 'verified'
            """, (gym_id,))
            verified_checkins = cursor.fetchone()[0]
            
            # Daily stats for last 7 days
            cursor.execute("""
                SELECT DATE(checkin_time) as date, COUNT(*) as count
                FROM checkins 
                WHERE gym_id = %s AND checkin_time >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(checkin_time)
                ORDER BY date ASC
            """, (gym_id,))
            
            daily_stats = []
            for row in cursor.fetchall():
                daily_stats.append({
                    "date": str(row[0]),
                    "count": row[1]
                })
            
            stats = {
                "today_checkins": today_checkins,
                "week_checkins": week_checkins,
                "month_checkins": month_checkins,
                "total_checkins": total_checkins,
                "pending_verifications": pending_verifications,
                "verified_checkins": verified_checkins,
                "daily_stats": daily_stats
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, stats, action)
    
    except Exception as e:
        print(f"GET MY GYM STATS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_my_gym_stats")


def get_gym_members(request):
    """Gym-ийн бүх гишүүдийн жагсаалт"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_members")
        
        gym_id = data.get("gym_id")
        
        if not gym_id:
            return sendResponse(request, 400, {"message": "gym_id required"}, action)
        
        myConn = connectDB()
        members_list = []
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                SELECT DISTINCT u.id, u.name, u.email, u.phone, 
                       um.start_date, um.end_date, mp.name as plan_name,
                       (SELECT COUNT(*) FROM checkins WHERE user_id = u.id AND gym_id = %s) as total_checkins,
                       (SELECT COUNT(*) FROM checkins WHERE user_id = u.id AND gym_id = %s AND DATE(checkin_time) = CURRENT_DATE) as today_checkin
                FROM users u
                JOIN user_memberships um ON u.id = um.user_id
                JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE um.status = 'active' AND CURRENT_DATE <= um.end_date
                ORDER BY u.name ASC
            """, (gym_id, gym_id))
            
            rows = cursor.fetchall()
            for row in rows:
                member_dict = {
                    "id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "phone": row[3] or "",
                    "start_date": str(row[4]) if row[4] else None,
                    "end_date": str(row[5]) if row[5] else None,
                    "plan_name": row[6],
                    "total_checkins": row[7] or 0,
                    "today_checkin": row[8] or 0
                }
                members_list.append(member_dict)
        
        disconnectDB(myConn)
        return sendResponse(request, 200, members_list, action)
    
    except Exception as e:
        print(f"GET GYM MEMBERS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_members")


def get_gym_member_detail(request):
    """Gym-ийн тухайн гишүүний дэлгэрэнгүй мэдээлэл"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "get_gym_member_detail")
        
        gym_id = data.get("gym_id")
        user_id = data.get("user_id")
        
        if not gym_id or not user_id:
            return sendResponse(request, 400, {"message": "gym_id and user_id required"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            # Get member info
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.phone, u.address, u.birth_date, u.gender,
                       um.start_date, um.end_date, mp.name as plan_name, mp.price
                FROM users u
                JOIN user_memberships um ON u.id = um.user_id
                JOIN membership_plans mp ON um.plan_id = mp.id
                WHERE u.id = %s AND um.status = 'active'
            """, (user_id,))
            
            member = cursor.fetchone()
            
            if not member:
                return sendResponse(request, 404, {"message": "Гишүүн олдсонгүй"}, action)
            
            # Get checkin history for this gym
            cursor.execute("""
                SELECT c.id, c.checkin_time, c.verification_status, c.verified_at,
                       adm.name as verified_by_name
                FROM checkins c
                LEFT JOIN users adm ON c.verified_by = adm.id
                WHERE c.user_id = %s AND c.gym_id = %s
                ORDER BY c.checkin_time DESC
                LIMIT 20
            """, (user_id, gym_id))
            
            checkins = cursor.fetchall()
            checkin_list = []
            for ch in checkins:
                checkin_list.append({
                    "id": ch[0],
                    "checkin_time": str(ch[1]) if ch[1] else None,
                    "verification_status": ch[2],
                    "verified_at": str(ch[3]) if ch[3] else None,
                    "verified_by_name": ch[4] if ch[4] else None
                })
            
            member_detail = {
                "id": member[0],
                "name": member[1],
                "email": member[2],
                "phone": member[3] or "",
                "address": member[4] or "",
                "birth_date": str(member[5]) if member[5] else None,
                "gender": member[6] or "",
                "membership_start": str(member[7]) if member[7] else None,
                "membership_end": str(member[8]) if member[8] else None,
                "plan_name": member[9],
                "plan_price": float(member[10]),
                "checkins": checkin_list
            }
        
        disconnectDB(myConn)
        return sendResponse(request, 200, member_detail, action)
    
    except Exception as e:
        print(f"GET GYM MEMBER DETAIL ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "get_gym_member_detail")


def update_member_status(request):
    """Гишүүний статусыг өөрчлөх (active/cancelled/expired)"""
    try:
        data = json.loads(request.body)
        action = data.get("action", "update_member_status")
        
        membership_id = data.get("membership_id")
        status = data.get("status")
        
        if not membership_id or not status:
            return sendResponse(request, 400, {"message": "membership_id and status required"}, action)
        
        if status not in ['active', 'cancelled', 'expired']:
            return sendResponse(request, 400, {"message": "Invalid status"}, action)
        
        myConn = connectDB()
        
        with myConn.cursor() as cursor:
            cursor.execute("""
                UPDATE user_memberships 
                SET status = %s, updated_at = NOW()
                WHERE id = %s
                RETURNING id
            """, (status, membership_id))
            
            if cursor.fetchone():
                myConn.commit()
                return sendResponse(request, 200, {"message": f"Гишүүний статус {status} болж өөрчлөгдлөө"}, action)
            else:
                return sendResponse(request, 404, {"message": "Гишүүнчлэл олдсонгүй"}, action)
        
    except Exception as e:
        print(f"UPDATE MEMBER STATUS ERROR: {e}")
        return sendResponse(request, 500, {"error": str(e)}, "update_member_status")

# ==================== MAIN CHECK SERVICE ====================

# ==================== MAIN CHECK SERVICE ====================

@csrf_exempt
def checkService(request):
    """Үндсэн service router"""
    if request.method == "POST":
        content_type = request.content_type or ''
        
        # JSON content type шалгах
        if 'application/json' in content_type:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                resp = sendResponse(request, 3003, {"error": "Invalid JSON format"}, "no action")
                return JsonResponse(resp, status=400)

            action = data.get('action')
            if not action:
                resp = sendResponse(request, 3005, [], "no action")
                return JsonResponse(resp, status=400)

            # USER SERVICES
            if action == "login":
                return JsonResponse(dt_login(request))
            elif action == "register":
                return JsonResponse(dt_register(request))
            elif action == "changepassword":
                return JsonResponse(dt_changepassword(request))
            elif action == "get_user_profile":
                return JsonResponse(get_user_profile(request))
            elif action == "update_user_profile":
                return JsonResponse(update_user_profile(request))
            
            # ADMIN: USER ROLE MANAGEMENT
            elif action == "update_user_role":
                return JsonResponse(update_user_role(request))
            elif action == "get_all_users":
                return JsonResponse(get_all_users(request))
            elif action == "get_users_by_role":
                return JsonResponse(get_users_by_role(request))
            elif action == "get_gym_managers":
                return JsonResponse(get_gym_managers(request))
            
            # GYM CRUD
            elif action == "get_gyms":
                return JsonResponse(get_gyms(request))
            elif action == "get_gym_by_id":
                return JsonResponse(get_gym_by_id(request))
            elif action == "create_gym":
                return JsonResponse(create_gym(request))
            elif action == "update_gym":
                return JsonResponse(update_gym(request))
            elif action == "delete_gym":
                return JsonResponse(delete_gym(request))
            
            # GYM MANAGER
            elif action == "assign_gym_to_manager":
                return JsonResponse(assign_gym_to_manager(request))
            elif action == "get_manager_gym":
                return JsonResponse(get_manager_gym(request))
            elif action == "get_my_gym_stats":
                return JsonResponse(get_my_gym_stats(request))
            
            # GYM OWNER SERVICES
            elif action == "get_gym_attendance":
                return JsonResponse(get_gym_attendance(request))
            elif action == "get_attendance_report":
                return JsonResponse(get_attendance_report(request))
            elif action == "get_my_gym_stats":
                return JsonResponse(get_my_gym_stats(request))
            elif action == "get_gym_members":
                return JsonResponse(get_gym_members(request))
            elif action == "get_gym_member_detail":
                return JsonResponse(get_gym_member_detail(request))
            elif action == "update_member_status":
                return JsonResponse(update_member_status(request))
            # CHECK-OUT SERVICES (Шинээр нэмэх)
            elif action == "create_checkout":
                return JsonResponse(create_checkout(request))
            elif action == "get_active_checkin":
                return JsonResponse(get_active_checkin(request))
            elif action == "get_gym_active_checkins":
                return JsonResponse(get_gym_active_checkins(request))
            
            # CHECK-IN SERVICES (UPDATED)
            elif action == "create_checkin":
                return JsonResponse(create_checkin(request))
            elif action == "get_today_unverified_checkins":
                return JsonResponse(get_today_unverified_checkins(request))
            elif action == "get_all_unverified_checkins":
                return JsonResponse(get_all_unverified_checkins(request))
            elif action == "verify_checkin":
                return JsonResponse(verify_checkin(request))
            elif action == "get_verified_checkins_history":
                return JsonResponse(get_verified_checkins_history(request))
            elif action == "get_user_checkins":
                return JsonResponse(get_user_checkins(request))
            


            elif action == "create_review":
                return JsonResponse(create_review(request))
            elif action == "get_gym_reviews":
                return JsonResponse(get_gym_reviews(request))
            elif action == "get_user_reviews":
                return JsonResponse(get_user_reviews(request))
            elif action == "delete_review":
                return JsonResponse(delete_review(request))
            elif action == "get_top_rated_gyms":
                return JsonResponse(get_top_rated_gyms(request))
            elif action == "can_user_review":
                return JsonResponse(can_user_review(request))

            # REPLY TO REVIEW SERVICES
            elif action == "add_reply_to_review":
                return JsonResponse(add_reply_to_review(request))
            elif action == "get_review_replies":
                return JsonResponse(get_review_replies(request))
            elif action == "delete_reply":
                return JsonResponse(delete_reply(request))
            
            # GYM IMAGE
            elif action == 'get_gym_images':
                return get_gym_images(request)
            elif action == 'delete_gym_image':
                return delete_gym_image(request)
            # PLAN CRUD
            elif action == "get_all_plans":
                return JsonResponse(get_all_plans(request))
            elif action == "create_plan":
                return JsonResponse(create_plan(request))
            elif action == "update_plan":
                return JsonResponse(update_plan(request))
            elif action == "delete_plan":
                return JsonResponse(delete_plan(request))
            
            # PLAN-GYM ASSIGNMENT
            elif action == "assign_plan_to_gym":
                return JsonResponse(assign_plan_to_gym(request))
            elif action == "remove_plan_from_gym":
                return JsonResponse(remove_plan_from_gym(request))
            elif action == "get_gym_plans":
                return JsonResponse(get_gym_plans(request))
            elif action == "get_plan_gyms":
                return JsonResponse(get_plan_gyms(request))
            
            # MEMBERSHIP
            elif action == "create_membership":
                return JsonResponse(create_membership(request))
            elif action == "get_user_memberships":
                return JsonResponse(get_user_memberships(request))
            elif action == "cancel_membership":
                return JsonResponse(cancel_membership(request))
            elif action == "get_all_memberships":
                return JsonResponse(get_all_memberships(request))
            
            # CHECK-IN
            elif action == "check_user_access":
                return JsonResponse(check_user_access(request))
            elif action == "get_user_checkins":
                return JsonResponse(get_user_checkins(request))
            elif action == "get_gym_checkins":
                return JsonResponse(get_gym_checkins(request))
            elif action == "get_gym_checkin_stats":
                return JsonResponse(get_gym_checkin_stats(request))
            
            # DASHBOARD STATS
            elif action == "get_dashboard_stats":
                return JsonResponse(get_dashboard_stats(request))
            
            else:
                resp = sendResponse(request, 3001, [], action)
                return JsonResponse(resp, status=404)
        
        # multipart/form-data content type шалгах
        elif 'multipart/form-data' in content_type:
            action = request.POST.get('action')
            if not action:
                resp = sendResponse(request, 3005, [], "no action")
                return JsonResponse(resp, status=400)
            
            if action == "upload_gym_image":
                return upload_gym_image(request)
            else:
                resp = sendResponse(request, 3001, [], action)
                return JsonResponse(resp, status=404)
        
        # Бусад content type
        else:
            print(f"Unsupported content type: {content_type}")
            resp = sendResponse(request, 400, f"Unsupported content type: {content_type}", "no action")
            return JsonResponse(resp, status=415)
    
    # GET method нь зөвшөөрөхгүй
    else:
        resp = sendResponse(request, 3002, [], f"Method {request.method} not allowed")
        return JsonResponse(resp, status=405)
    